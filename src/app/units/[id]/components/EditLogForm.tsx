"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/lib/supabaseClient";
import { Log } from "@/types/log";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";

interface EditLogFormProps {
  log: Log;
  unitId: string;
  onCancel: () => void;
  onUpdate: (updatedLog: Log) => void;
}

interface Resource {
  id: number;
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

export default function EditLogForm({
  log,
  unitId,
  onCancel,
  onUpdate,
}: EditLogFormProps) {
  const [title, setTitle] = useState(log.title);
  const [learningTime, setLearningTime] = useState(log.learningTime);
  const [note, setNote] = useState(log.note);
  const [logDate, setLogDate] = useState(
    format(new Date(log.logDate), "yyyy-MM-dd")
  );
  const [tags, setTags] = useState<string[]>(
    log.logTags?.map(({ tag }) => tag.name) || []
  );
  const [newTag, setNewTag] = useState("");
  const [resources, setResources] = useState<Resource[]>(
    log.resources?.map((r) => ({
      id: r.id,
      resourceType: r.resourceType,
      resourceLink: r.resourceLink,
      description: r.description,
      fileName: r.fileName,
      filePath: r.filePath,
    })) || []
  );
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddResource = () => {
    if (newResourceTitle.trim() && newResourceLink.trim()) {
      setResources([
        ...resources,
        {
          id: Date.now(),
          resourceType: "link",
          resourceLink: newResourceLink.trim(),
          description: newResourceTitle.trim(),
        },
      ]);
      setNewResourceTitle("");
      setNewResourceLink("");
    }
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleUpdateResource = (
    index: number,
    field: "description" | "resourceLink",
    value: string
  ) => {
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      [field]: value,
    };
    setResources(updatedResources);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadButtonClick = async () => {
    if (selectedFile) {
      await handleFileUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true);

      const publicUrl = await storage.uploadResource(file, unitId);

      // リソースとして追加
      setResources([
        ...resources,
        {
          id: Date.now(),
          resourceType: "file",
          resourceLink: publicUrl,
          description: file.name,
          fileName: file.name,
          filePath: `${unitId}/${file.name}`,
        },
      ]);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ファイルのアップロードに失敗しました"
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownload = (filePath: string) => {
    const publicUrl = storage.getResourceUrl(filePath);
    window.open(publicUrl, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formattedResources = resources.map((resource) => ({
        id: resource.id,
        resourceType: resource.resourceType,
        resourceLink: resource.resourceLink,
        description: resource.description,
        fileName: resource.fileName || undefined,
        filePath: resource.filePath || undefined,
      }));

      const response = await fetch(`/api/units/${unitId}/logs/${log.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          learningTime,
          note,
          logDate,
          tags,
          resources: formattedResources,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("サーバーエラー:", errorData);
        throw new Error("ログの更新に失敗しました");
      }

      const data = await response.json();
      onUpdate(data.data);
      onCancel();
    } catch (error) {
      console.error("Error updating log:", error);
      alert("ログの更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="learningTime">学習時間（分）</Label>
        <Input
          id="learningTime"
          type="number"
          value={learningTime}
          onChange={(e) => setLearningTime(parseInt(e.target.value))}
          required
          min="1"
        />
      </div>

      <div>
        <Label htmlFor="logDate">日付</Label>
        <Input
          id="logDate"
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="note">内容</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>タグ</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="新しいタグ"
          />
          <Button type="button" onClick={handleAddTag}>
            追加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1 bg-secondary px-2 py-1 rounded"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>参考資料</Label>
        <div className="space-y-4">
          {resources.map((resource, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  value={resource.description || ""}
                  onChange={(e) =>
                    handleUpdateResource(index, "description", e.target.value)
                  }
                  placeholder="参考資料のタイトル"
                />
                {resource.resourceType === "file" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {resource.fileName}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => handleDownload(resource.filePath!)}
                      className="text-sm text-primary hover:underline"
                    >
                      ダウンロード
                    </Button>
                  </div>
                ) : (
                  <Input
                    value={resource.resourceLink}
                    onChange={(e) =>
                      handleUpdateResource(
                        index,
                        "resourceLink",
                        e.target.value
                      )
                    }
                    placeholder="https://example.com"
                  />
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleRemoveResource(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">新しい参考資料を追加</h4>
            <div className="space-y-2">
              <div>
                <Label htmlFor="resourceTitle">タイトル</Label>
                <Input
                  id="resourceTitle"
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  placeholder="参考資料のタイトル"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="resourceLink">URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resourceLink"
                      value={newResourceLink}
                      onChange={(e) => setNewResourceLink(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddResource}
                      disabled={
                        !newResourceTitle.trim() || !newResourceLink.trim()
                      }
                    >
                      追加
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <Label>ファイル</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        onChange={handleFileInputChange}
                        className="flex-1"
                        disabled={uploadingFile}
                      />
                    </div>
                    {selectedFile && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          選択されたファイル: {selectedFile.name}
                        </span>
                        <Button
                          type="button"
                          onClick={handleUploadButtonClick}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? "アップロード中..." : "アップロード"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          更新
        </Button>
      </div>
    </form>
  );
}
