"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { unitUpdateSchema } from "@/types/unit";
import { handleApiError } from "@/utils/error-handler";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Calendar,
  Eye,
  FileText,
  Save,
  Settings,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type UnitFormValues = z.infer<typeof unitUpdateSchema>;

interface Tag {
  id: number;
  name: string;
}

interface EditUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: {
    id: number;
    title: string;
    learningGoal: string;
    preLearningState: string;
    reflection: string;
    nextAction: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    displayFlag: boolean;
    tags: { id: number; name: string }[];
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
  const [tags, setTags] = useState<Tag[]>(unit.tags || []);
  const [newTag, setNewTag] = useState("");

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitUpdateSchema),
    defaultValues: {
      title: unit.title,
      learningGoal: unit.learningGoal,
      preLearningState: unit.preLearningState,
      reflection: unit.reflection,
      nextAction: unit.nextAction,
      startDate: unit.startDate
        ? new Date(unit.startDate).toISOString().slice(0, 10)
        : undefined,
      endDate: unit.endDate
        ? new Date(unit.endDate).toISOString().slice(0, 10)
        : undefined,
      status: unit.status as "PLANNED" | "IN_PROGRESS" | "COMPLETED",
      displayFlag: unit.displayFlag,
      tags: unit.tags?.map((tag) => tag.name) || [],
    },
  });

  const handleAddTag = () => {
    if (newTag.trim() && !tags.some((tag) => tag.name === newTag.trim())) {
      const newTagObj = { id: Date.now(), name: newTag.trim() };
      setTags([...tags, newTagObj]);
      form.setValue("tags", [...(form.getValues("tags") || []), newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagId: number) => {
    const updatedTags = tags.filter((tag) => tag.id !== tagId);
    setTags(updatedTags);
    form.setValue(
      "tags",
      updatedTags.map((tag) => tag.name)
    );
  };

  const handleSubmit = async (values: UnitFormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("ユニットを更新しました");
        onSave();
        onOpenChange(false);
      } else {
        await handleApiError(response);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      toast.error("ネットワークエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const formFields = [
    {
      id: "title",
      label: "タイトル",
      icon: <FileText className="w-4 h-4" />,
      component: (field: any) => (
        <Input
          placeholder="学習ユニットのタイトルを入力"
          disabled={isLoading}
          {...field}
        />
      ),
    },
    {
      id: "learningGoal",
      label: "学習目標",
      icon: <Target className="w-4 h-4" />,
      component: (field: any) => (
        <Textarea
          placeholder="この学習で達成したい目標を記述してください"
          rows={3}
          disabled={isLoading}
          {...field}
        />
      ),
    },
    {
      id: "preLearningState",
      label: "事前の学習状態",
      icon: <Eye className="w-4 h-4" />,
      component: (field: any) => (
        <Textarea
          placeholder="学習開始前の知識レベルや経験を記述してください"
          rows={3}
          disabled={isLoading}
          {...field}
        />
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogTitle className="sr-only">ユニット編集</DialogTitle>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
        >
          {/* ヘッダー */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  ユニット編集
                </h2>
                <p className="text-sm text-muted-foreground">
                  学習内容を更新してください
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
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
                      >
                        <FormField
                          control={form.control}
                          name={field.id as keyof UnitFormValues}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 font-medium text-foreground">
                                {field.icon}
                                {field.label}
                              </FormLabel>
                              <FormControl>
                                {field.component(formField)}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* 振り返りとアクション */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <FormField
                        control={form.control}
                        name="reflection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-medium">
                              <FileText className="w-4 h-4" />
                              振り返り
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="学習を通じて得た知見や感想を記述してください"
                                rows={4}
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <FormField
                        control={form.control}
                        name="nextAction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-medium">
                              <Target className="w-4 h-4" />
                              次のアクション
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="次に取り組むべき具体的なアクションを記述してください"
                                rows={4}
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  </div>

                  {/* 日付設定 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-medium">
                            <Calendar className="w-4 h-4" />
                            開始日
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              disabled={isLoading}
                              {...field}
                              value={
                                field.value
                                  ? new Date(field.value)
                                      .toISOString()
                                      .slice(0, 10)
                                  : ""
                              }
                              onChange={(e) => {
                                if (e.target.value) {
                                  // date値をYYYY-MM-DD形式で保存
                                  field.onChange(e.target.value);
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-medium">
                            <Calendar className="w-4 h-4" />
                            終了日
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              disabled={isLoading}
                              {...field}
                              value={
                                field.value
                                  ? new Date(field.value)
                                      .toISOString()
                                      .slice(0, 10)
                                  : ""
                              }
                              onChange={(e) => {
                                if (e.target.value) {
                                  // date値をYYYY-MM-DD形式で保存
                                  field.onChange(e.target.value);
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* ステータスと公開設定 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-medium">
                            <Settings className="w-4 h-4" />
                            ステータス
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="ステータスを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PLANNED">計画中</SelectItem>
                              <SelectItem value="IN_PROGRESS">
                                進行中
                              </SelectItem>
                              <SelectItem value="COMPLETED">完了</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayFlag"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-medium">
                            <Settings className="w-4 h-4" />
                            公開設定
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value === "public")
                            }
                            defaultValue={field.value ? "public" : "private"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="公開設定を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600">🌐</span>
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
                                  <span className="text-orange-600">🔒</span>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* タグ */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-3"
                  >
                    <Label className="flex items-center gap-2 font-medium">
                      <FileText className="w-4 h-4" />
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
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        onClick={handleAddTag}
                        disabled={!newTag.trim() || isLoading}
                        variant="outline"
                      >
                        追加
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-sm"
                        >
                          <span>{tag.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            disabled={isLoading}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* フッター */}
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
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
