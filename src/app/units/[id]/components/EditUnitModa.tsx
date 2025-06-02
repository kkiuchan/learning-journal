"use client";

import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  Calendar,
  Eye,
  FileText,
  Flag,
  Globe,
  Lock,
  Plus,
  Save,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Tag {
  id: number;
  name: string;
}

interface EditFormValues {
  title: string;
  learningGoal: string;
  preLearningState: string;
  reflection: string;
  nextAction: string;
  startDate: string;
  endDate: string;
  status: string;
  displayFlag: boolean;
  tags: Tag[];
}

interface EditUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: {
    id: number;
    title: string;
    learningGoal: string | null;
    preLearningState: string | null;
    reflection: string | null;
    nextAction: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    displayFlag: boolean;
    tags?: Tag[];
  };
  onSave: () => void;
}

export function EditUnitModal({
  open,
  onOpenChange,
  unit,
  onSave,
}: EditUnitModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [values, setValues] = useState<EditFormValues>({
    title: unit.title,
    learningGoal: unit.learningGoal || "",
    preLearningState: unit.preLearningState || "",
    reflection: unit.reflection || "",
    nextAction: unit.nextAction || "",
    startDate: unit.startDate
      ? new Date(unit.startDate).toISOString().split("T")[0]
      : "",
    endDate: unit.endDate
      ? new Date(unit.endDate).toISOString().split("T")[0]
      : "",
    status: unit.status,
    displayFlag: unit.displayFlag,
    tags: unit.tags || [],
  });

  const handleAddTag = () => {
    if (newTag.trim()) {
      setValues((prev) => ({
        ...prev,
        tags: [...prev.tags, { id: Date.now(), name: newTag.trim() }],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== tagId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          learningGoal: values.learningGoal,
          preLearningState: values.preLearningState,
          reflection: values.reflection,
          nextAction: values.nextAction,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          status: values.status,
          displayFlag: values.displayFlag,
          unitTags: values.tags.map((tag) => tag.name),
        }),
      });

      if (response.ok) {
        toast.success("ユニットを更新しました");
        onSave();
        onOpenChange(false);
      } else {
        const error = await response.json();
        console.error("ユニットの更新に失敗しました:", error);
        toast.error("ユニットの更新に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const formFields = [
    {
      id: "title",
      label: "タイトル",
      icon: <FileText className="w-4 h-4" />,
      component: (
        <Input
          id="title"
          value={values.title}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="学習ユニットのタイトルを入力"
          required
          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
      ),
    },
    {
      id: "learningGoal",
      label: "学習目標",
      icon: <Target className="w-4 h-4" />,
      component: (
        <Textarea
          id="learningGoal"
          value={values.learningGoal}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, learningGoal: e.target.value }))
          }
          placeholder="この学習で達成したい目標を記述してください"
          rows={3}
          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
      ),
    },
    {
      id: "preLearningState",
      label: "事前の学習状態",
      icon: <Eye className="w-4 h-4" />,
      component: (
        <Textarea
          id="preLearningState"
          value={values.preLearningState}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              preLearningState: e.target.value,
            }))
          }
          placeholder="学習開始前の知識レベルや経験を記述してください"
          rows={3}
          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
      ),
    },
  ];

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
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5 shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <FileText className="w-4 h-4 text-primary" />
              </motion.div>
              ユニットを編集
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              学習ユニットの詳細を更新してください
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* スクロール可能コンテンツ */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* メイン情報 */}
                <div className="grid gap-6">
                  {formFields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <Label
                        htmlFor={field.id}
                        className="flex items-center gap-2 font-medium text-foreground"
                      >
                        {field.icon}
                        {field.label}
                      </Label>
                      {field.component}
                    </motion.div>
                  ))}
                </div>

                {/* 振り返りとアクション */}
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="reflection"
                      className="flex items-center gap-2 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      振り返り
                    </Label>
                    <Textarea
                      id="reflection"
                      value={values.reflection}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          reflection: e.target.value,
                        }))
                      }
                      placeholder="学習を通して得た気づきや学びを記述してください"
                      rows={4}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="nextAction"
                      className="flex items-center gap-2 font-medium"
                    >
                      <Flag className="w-4 h-4" />
                      次のアクション
                    </Label>
                    <Textarea
                      id="nextAction"
                      value={values.nextAction}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          nextAction: e.target.value,
                        }))
                      }
                      placeholder="今後の学習計画や次に取り組むことを記述してください"
                      rows={4}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>
                </div>

                {/* 日付とステータス */}
                <div className="grid md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="startDate"
                      className="flex items-center gap-2 font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      開始日
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={values.startDate}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="cursor-pointer"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="endDate"
                      className="flex items-center gap-2 font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      終了日
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={values.endDate}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="cursor-pointer"
                      min={values.startDate}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="status"
                      className="flex items-center gap-2 font-medium"
                    >
                      <Flag className="w-4 h-4" />
                      ステータス
                    </Label>
                    <Select
                      value={values.status}
                      onValueChange={(value) =>
                        setValues((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ステータスを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNED">未着手</SelectItem>
                        <SelectItem value="IN_PROGRESS">進行中</SelectItem>
                        <SelectItem value="COMPLETED">完了</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </div>

                {/* 公開設定 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="displayFlag"
                    className="flex items-center gap-2 font-medium"
                  >
                    {values.displayFlag ? (
                      <Globe className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-orange-600" />
                    )}
                    公開設定
                  </Label>
                  <Select
                    value={values.displayFlag ? "public" : "private"}
                    onValueChange={(v) =>
                      setValues((prev) => ({
                        ...prev,
                        displayFlag: v === "public",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="公開設定を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium">公開</div>
                            <div className="text-xs text-muted-foreground">
                              他のユーザーも閲覧可能
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-orange-600" />
                          <div>
                            <div className="font-medium">非公開</div>
                            <div className="text-xs text-muted-foreground">
                              自分のみ閲覧可能
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* タグ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2 font-medium">
                    <Plus className="w-4 h-4" />
                    タグ
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="新しいタグを入力"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      variant="outline"
                      size="icon"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {values.tags.map((tag, index) => (
                      <motion.div
                        key={tag.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Badge
                          variant="secondary"
                          className="px-3 py-1 flex items-center gap-2"
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
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
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
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
