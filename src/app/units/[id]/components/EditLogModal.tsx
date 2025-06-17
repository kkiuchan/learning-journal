"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { useSyncedState } from "@/hooks/useSyncedState";
import { storage } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { LogDTO } from "@/types/log";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Save,
  Star,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface Resource {
  id: number;
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

interface EditLogFormValues {
  title: string;
  learningTime: number;
  note: string;
  logDate: string;
  tags: string[];
  resources: Resource[];
  effectScore: number;
  effectType: string;
}

interface EditLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: LogDTO;
  unitId: string;
  onUpdate: (updatedLog: LogDTO) => void;
  onSubmit: (form: EditLogFormValues) => Promise<void>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
}

export function EditLogModal({
  open,
  onOpenChange,
  log,
  unitId,
  onUpdate,
  onSubmit,
  tags,
  setTags,
  resources,
  setResources,
}: EditLogModalProps) {
  const { isComposing, onCompositionStart, onCompositionEnd } =
    useCompositionInput();
  const [title, setTitle] = useSyncedState(log.title);
  const [learningTime, setLearningTime] = useState(log.learningTime);
  const [note, setNote] = useSyncedState(log.note);
  const [logDate, setLogDate] = useState(
    format(new Date(log.logDate), "yyyy-MM-dd")
  );
  const [newTag, setNewTag] = useState("");
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [effectScore, setEffectScore] = useState(log.effectScore || 0);
  const [effectType, setEffectType] = useState(
    log.effectType || "understanding"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

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
      toast.success("ファイルをアップロードしました");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
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
      await onSubmit({
        title,
        learningTime,
        note,
        logDate,
        tags,
        resources,
        effectScore,
        effectType,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating log:", error);
      toast.error("学習ログの更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="h-full flex flex-col"
        >
          {/* 固定ヘッダー */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"
              >
                <FileText className="w-4 h-4 text-blue-600" />
              </motion.div>
              学習ログを編集
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              学習ログの詳細を更新してください
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* スクロール可能コンテンツ */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="title"
                      className="flex items-center gap-2 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      タイトル
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="学習内容のタイトル"
                      disabled={isSubmitting}
                      onCompositionStart={onCompositionStart}
                      onCompositionEnd={onCompositionEnd}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="learningTime"
                      className="flex items-center gap-2 font-medium"
                    >
                      <Clock className="w-4 h-4" />
                      学習時間（分）
                    </Label>
                    <Input
                      id="learningTime"
                      type="number"
                      value={learningTime}
                      onChange={(e) =>
                        setLearningTime(parseInt(e.target.value))
                      }
                      required
                      min="1"
                      disabled={isSubmitting}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="logDate"
                    className="flex items-center gap-2 font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    日付
                  </Label>
                  <Input
                    id="logDate"
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="max-w-xs cursor-pointer"
                  />
                </motion.div>

                {/* 学習内容 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="note"
                      className="flex items-center gap-2 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      内容
                    </Label>
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
                    <div className="min-h-[200px] p-4 border rounded-md bg-background prose prose-sm max-w-none dark:prose-invert whitespace-pre-line">
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
                      className="w-full font-mono transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                      required
                      disabled={isSubmitting}
                      onCompositionStart={onCompositionStart}
                      onCompositionEnd={onCompositionEnd}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Markdown記法が使用できます（見出し、リスト、コードブロックなど）
                  </p>
                </motion.div>

                {/* 効果評価 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <Label className="flex items-center gap-2 font-medium">
                      <Star className="w-4 h-4" />
                      効果実感スコア
                    </Label>
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
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <Label className="font-medium">効果のタイプ</Label>
                    <div className="space-y-1">
                      {effectTypes.map((type) => (
                        <label
                          key={type.value}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="effectType"
                            value={type.value}
                            checked={effectType === type.value}
                            onChange={(e) =>
                              setEffectType(e.target.value as any)
                            }
                            className="form-radio text-blue-500"
                            disabled={isSubmitting}
                          />
                          {type.label}
                        </label>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* タグ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2 font-medium">
                    <Tag className="w-4 h-4" />
                    タグ
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="新しいタグを入力"
                      disabled={isSubmitting}
                      onCompositionStart={onCompositionStart}
                      onCompositionEnd={onCompositionEnd}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isComposing) {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={isSubmitting || !newTag.trim()}
                      variant="outline"
                      size="icon"
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* 参考資料 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-4"
                >
                  <Label className="flex items-center gap-2 font-medium">
                    <Upload className="w-4 h-4" />
                    参考資料
                  </Label>

                  {/* 既存の参考資料 */}
                  <div className="space-y-3">
                    {resources.map((resource, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 border rounded-lg"
                      >
                        <div className="flex-1 space-y-2">
                          <Input
                            value={resource.description || ""}
                            onChange={(e) =>
                              handleUpdateResource(
                                index,
                                "description",
                                e.target.value
                              )
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
                                onClick={() =>
                                  handleDownload(resource.filePath!)
                                }
                                className="text-sm text-primary hover:underline p-0"
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
                          size="icon"
                          onClick={() => handleRemoveResource(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* 新しい参考資料を追加 */}
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h4 className="font-medium">新しい参考資料を追加</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="resourceTitle">タイトル</Label>
                        <Input
                          id="resourceTitle"
                          value={newResourceTitle}
                          onChange={(e) => setNewResourceTitle(e.target.value)}
                          placeholder="参考資料のタイトル"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="resourceLink">URL</Label>
                          <div className="flex gap-2">
                            <Input
                              id="resourceLink"
                              value={newResourceLink}
                              onChange={(e) =>
                                setNewResourceLink(e.target.value)
                              }
                              placeholder="https://example.com"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={handleAddResource}
                              disabled={
                                !newResourceTitle.trim() ||
                                !newResourceLink.trim()
                              }
                              variant="outline"
                            >
                              追加
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>ファイル</Label>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              onChange={handleFileInputChange}
                              disabled={uploadingFile}
                            />
                            {selectedFile && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground truncate">
                                  {selectedFile.name}
                                </span>
                                <Button
                                  type="button"
                                  onClick={handleUploadButtonClick}
                                  disabled={uploadingFile}
                                  size="sm"
                                  variant="outline"
                                >
                                  {uploadingFile
                                    ? "アップロード中..."
                                    : "アップロード"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 固定フッター */}
            <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Save className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    更新
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
