"use client";

import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useComments } from "@/hooks/useComments";
import { Unit } from "@/types";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface UnitContentProps {
  unit: Unit;
  session: Session | null;
  onMutate: () => void;
  id: string;
}

export function UnitContent({ unit, session, onMutate, id }: UnitContentProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [achievementLevel, setAchievementLevel] = useState(
    unit.achievementLevel || 0
  );

  const { mutate: mutateComments, optimisticUpdate } = useComments({
    unitId: id,
    page: 1,
    limit: 10,
  });

  const handleAddAIComment = async (comment: string) => {
    if (!session?.user) return;

    try {
      // 楽観的更新
      const optimisticComment = {
        id: Date.now(),
        comment: comment,
        createdAt: new Date().toISOString(),
        user: {
          id: "ai-assistant",
          name: "AIアシスタント",
          image: "/images/ai-assistant.png",
        },
      };

      await optimisticUpdate("create", optimisticComment);

      const response = await fetch(`/api/units/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: comment,
          isAI: true,
        }),
      });

      if (!response.ok) {
        mutateComments();
        const data = await response.json();
        throw new Error(data.error || "コメントの追加に失敗しました");
      }
    } catch (error) {
      console.error("Error adding AI comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの追加に失敗しました"
      );
      mutateComments();
    }
  };

  const handleAchievementUpdate = async (value: number) => {
    if (!session || session.user.id !== unit.userId) return;
    if (isUpdating) return;

    // 以前の値を保存
    const previousValue = achievementLevel;

    // 楽観的に更新
    setAchievementLevel(value);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/units/${unit.id}/achievement`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          achievementLevel: value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onMutate();
        toast.success("達成度を更新しました");
      } else {
        throw new Error(data.error || "達成度の更新に失敗しました");
      }
    } catch (error) {
      console.error("Error updating achievement level:", error);
      // エラー時は以前の値に戻す
      setAchievementLevel(previousValue);
      toast.error(
        error instanceof Error ? error.message : "達成度の更新に失敗しました"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-4 mt-4">
      <div className="space-y-4">
        {session?.user?.id === unit.userId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-2">達成度</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  value={[achievementLevel]}
                  onValueChange={(value) => setAchievementLevel(value[0])}
                  onValueCommit={(value) => handleAchievementUpdate(value[0])}
                  max={100}
                  step={1}
                  disabled={isUpdating}
                  className="transition-opacity duration-200"
                  style={{ opacity: isUpdating ? 0.7 : 1 }}
                />
              </div>
              <motion.div
                key={achievementLevel}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-16 text-right font-medium"
              >
                {achievementLevel}%
              </motion.div>
            </div>
          </motion.div>
        )}

        {unit.learningGoal && (
          <div>
            <h3 className="text-lg font-semibold mb-2">学習目標</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {unit.learningGoal}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {unit.preLearningState && (
          <div>
            <h3 className="text-lg font-semibold mb-2">学習前の状態</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {unit.preLearningState}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {unit.reflection && (
          <div>
            <h3 className="text-lg font-semibold mb-2">振り返り</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {unit.reflection}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {unit.nextAction && (
          <div>
            <h3 className="text-lg font-semibold mb-2">次のアクション</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {unit.nextAction}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
