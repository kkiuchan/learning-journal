"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { storage } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Eye, EyeOff, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CreateLogFormProps {
  unitId: string;
  onCancel: () => void;
  onSuccess: () => void;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  onSubmit: (form: any) => Promise<void>;
}

interface Resource {
  id?: number;
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

export default function CreateLogForm({
  unitId,
  onCancel,
  onSuccess,
  tags,
  setTags,
  resources,
  setResources,
  onSubmit,
}: CreateLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [learningTime, setLearningTime] = useState(0);
  const [note, setNote] = useState("");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newTag, setNewTag] = useState("");
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [effectScore, setEffectScore] = useState<number>(3);
  const [effectType, setEffectType] = useState<string>("understanding");
  const [showPreview, setShowPreview] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const router = useRouter();
  const { isComposing, onCompositionStart, onCompositionEnd } =
    useCompositionInput();

  const effectTypes = [
    { value: "understanding", label: "理解が深まった" },
    { value: "practical", label: "実際に使えるようになった" },
    { value: "application", label: "応用のアイデアが生まれた" },
    { value: "none", label: "特になかった" },
  ];

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
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        learningTime,
        note,
        logDate,
        tags,
        effectScore,
        effectType,
        resources: resources.map((r) => ({
          resourceType: r.resourceType,
          resourceLink: r.resourceLink,
          description: r.description,
          fileName: r.fileName,
          filePath: r.filePath,
        })),
      });
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error creating log:", error);
      alert("ログの作成中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="学習内容のタイトル"
            disabled={isSubmitting}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
          />
        </div>

        <div>
          <Label htmlFor="logDate">日付</Label>
          <Input
            id="logDate"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="learningTime">学習時間（分）</Label>
          <Input
            id="learningTime"
            type="number"
            value={learningTime}
            onChange={(e) => setLearningTime(Number(e.target.value))}
            min="1"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label>効果実感スコア</Label>
          <div
            className="flex items-center gap-2"
            onMouseLeave={() => setHoveredScore(null)}
          >
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setEffectScore(score)}
                onMouseEnter={() => setHoveredScore(score)}
                disabled={isSubmitting}
                className="transition-all hover:scale-110 focus:outline-none"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-all cursor-pointer",
                    score <= (hoveredScore || effectScore)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-transparent text-gray-300 hover:text-yellow-300"
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              {effectScore}/5
            </span>
          </div>
        </div>

        <div>
          <Label>効果のタイプ</Label>
          <div className="space-y-1">
            {effectTypes.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-1 text-sm"
              >
                <input
                  type="radio"
                  name="effectType"
                  value={type.value}
                  checked={effectType === type.value}
                  onChange={(e) => setEffectType(e.target.value)}
                  className="form-radio"
                  disabled={isSubmitting}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="note">学習内容</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                エディタを表示
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                プレビュー
              </>
            )}
          </Button>
        </div>
        {showPreview ? (
          <div className="min-h-[200px] p-4 border rounded-md bg-background prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note || "プレビューする内容がありません"}
            </ReactMarkdown>
          </div>
        ) : (
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="学習内容の詳細（Markdown形式で記述できます）"
            rows={8}
            className="w-full font-mono"
            disabled={isSubmitting}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
          />
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Markdown記法が使用できます（見出し、リスト、コードブロックなど）
        </p>
      </div>

      <div>
        <Label>タグ</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="新しいタグ"
            disabled={isSubmitting}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isComposing) {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" onClick={handleAddTag} disabled={isSubmitting}>
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleRemoveResource(index)}
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      onClick={handleAddResource}
                      disabled={
                        isSubmitting ||
                        !newResourceTitle.trim() ||
                        !newResourceLink.trim()
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
                        disabled={uploadingFile || isSubmitting}
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
                          disabled={uploadingFile || isSubmitting}
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
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "作成中..." : "作成"}
        </Button>
      </div>
    </form>
  );
}
