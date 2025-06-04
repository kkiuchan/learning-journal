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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  FileText,
  Globe,
  Lock,
  Plus,
  Save,
  Tag,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Tag {
  id: number;
  name: string;
}

interface UnitFormValues {
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

interface CreateUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUnitModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateUnitModalProps) {
  const { isComposing, onCompositionStart, onCompositionEnd } =
    useCompositionInput();
  const { session } = useSupabaseAuth();

  // デバッグ: useSupabaseAuth の結果を確認
  console.log("[CreateUnitModal] useSupabaseAuth result:", {
    session,
    hasSession: !!session,
    sessionType: typeof session,
    sessionKeys: session ? Object.keys(session) : "no session",
    accessToken: session?.access_token,
    hasAccessToken: !!session?.access_token,
    user: session?.user,
    userId: session?.user?.id,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [values, setValues] = useState<UnitFormValues>({
    title: "",
    learningGoal: "",
    preLearningState: "",
    reflection: "",
    nextAction: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    status: "PLANNED",
    displayFlag: true,
    tags: [],
  });

  const handleAddTag = () => {
    if (
      newTag.trim() &&
      !values.tags.some((tag) => tag.name === newTag.trim())
    ) {
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
      console.log("[CreateUnitModal] handleSubmit start - session details:", {
        sessionExists: !!session,
        sessionType: typeof session,
        sessionNull: session === null,
        sessionUndefined: session === undefined,
        sessionFalsy: !session,
        sessionTruthy: !!session,
        accessTokenExists: !!session?.access_token,
        accessTokenValue: session?.access_token
          ? session.access_token.substring(0, 20) + "..."
          : "no access token",
        userExists: !!session?.user,
        userId: session?.user?.id,
      });

      console.log("[CreateUnitModal] Session state:", {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        sessionUserId: session?.user?.id,
      });

      if (!session) {
        console.error("[CreateUnitModal] No session available");
        toast.error("認証が必要です");
        return;
      }

      if (!session.access_token) {
        console.error("[CreateUnitModal] No access token in session");
        toast.error("認証トークンが見つかりません");
        return;
      }

      const requestHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      };

      console.log("[CreateUnitModal] Making API request with headers:", {
        ...requestHeaders,
        Authorization: `Bearer ${session.access_token.substring(0, 20)}...`,
      });

      const response = await fetch("/api/units", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          ...values,
          tags: values.tags.map((tag) => tag.name),
        }),
      });

      console.log("[CreateUnitModal] API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        toast.success("ユニットを作成しました");
        onOpenChange(false);
        onSuccess();
        // 作成したユニットページに遷移
        window.location.href = `/units/${data.data.id}`;
      } else {
        const error = await response.json();
        console.error("ユニットの作成に失敗しました:", error);
        toast.error("ユニットの作成に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setValues({
      title: "",
      learningGoal: "",
      preLearningState: "",
      reflection: "",
      nextAction: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      status: "PLANNED",
      displayFlag: true,
      tags: [],
    });
    setNewTag("");
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <BookOpen className="w-4 h-4 text-blue-600" />
              </motion.div>
              新規ユニット作成
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              新しい学習ユニットを作成してください
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="title"
                    className="flex items-center gap-2 font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    タイトル <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={values.title}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, title: e.target.value }))
                    }
                    required
                    placeholder="ユニットのタイトルを入力してください"
                    disabled={isLoading}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="learningGoal"
                    className="flex items-center gap-2 font-medium"
                  >
                    <Target className="w-4 h-4" />
                    学習目標
                  </Label>
                  <Textarea
                    id="learningGoal"
                    value={values.learningGoal}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, learningGoal: e.target.value }))
                    }
                    placeholder="この学習で達成したい目標を記述してください"
                    disabled={isLoading}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    rows={3}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="preLearningState"
                    className="flex items-center gap-2 font-medium"
                  >
                    <BookOpen className="w-4 h-4" />
                    事前の学習状態
                  </Label>
                  <Textarea
                    id="preLearningState"
                    value={values.preLearningState}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        preLearningState: e.target.value,
                      }))
                    }
                    placeholder="この学習を始める前の知識レベルや経験を記述してください"
                    disabled={isLoading}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    rows={3}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                      setValues((v) => ({ ...v, reflection: e.target.value }))
                    }
                    placeholder="学習を通じて得た知見や感想を記述してください（後で更新可能）"
                    disabled={isLoading}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    rows={3}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="nextAction"
                    className="flex items-center gap-2 font-medium"
                  >
                    <Target className="w-4 h-4" />
                    次のアクション
                  </Label>
                  <Textarea
                    id="nextAction"
                    value={values.nextAction}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, nextAction: e.target.value }))
                    }
                    placeholder="次に取り組むべき具体的なアクションを記述してください"
                    disabled={isLoading}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    rows={3}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>

                {/* 日程設定 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
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
                        setValues((v) => ({ ...v, startDate: e.target.value }))
                      }
                      disabled={isLoading}
                      className="cursor-pointer"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="endDate"
                      className="flex items-center gap-2 font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      終了日（予定）
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={values.endDate}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, endDate: e.target.value }))
                      }
                      disabled={isLoading}
                      className="cursor-pointer"
                      min={values.startDate}
                    />
                  </motion.div>
                </div>

                {/* ステータスと公開設定 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="status" className="font-medium">
                      ステータス
                    </Label>
                    <Select
                      value={values.status}
                      onValueChange={(v) =>
                        setValues((prev) => ({ ...prev, status: v }))
                      }
                      disabled={isLoading}
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

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="displayFlag" className="font-medium">
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
                      disabled={isLoading}
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
                </div>

                {/* タグ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
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
                      disabled={isLoading}
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
                      disabled={isLoading || !newTag.trim()}
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
                        className="flex items-center gap-1 bg-secondary px-2 py-1 rounded"
                      >
                        <span>{tag.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag.id)}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </button>
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
                onClick={() => handleOpenChange(false)}
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
                    作成
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
