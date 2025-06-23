"use client";

import { AdviceButton } from "@/components/AdviceButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useLogs } from "@/hooks/useLogs";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "sonner";
import { CreateLogModal } from "./CreateLogModal";
import { EditLogModal } from "./EditLogModal";
import LogCard from "./LogCard";
import { TableOfContents } from "./TableOfContents";

interface LogsSectionProps {
  unitId: string;
  userId: string;
  session: Session | null;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onAIAdvice: (comment: string) => void;
}

// CreateLogModalのResource型
interface CreateLogResource {
  id?: number;
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

export const LogsSection = memo(function LogsSection({
  unitId,
  userId,
  session,
  openMenuId,
  setOpenMenuId,
  onAIAdvice,
}: LogsSectionProps) {
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [deletingLogIds, setDeletingLogIds] = useState<number[]>([]);

  // 作成フォーム状態（データ保持用）
  const [createFormData, setCreateFormData] = useState({
    title: "",
    learningTime: 30,
    note: "",
    logDate: format(new Date(), "yyyy-MM-dd"),
    effectScore: 3,
    effectType: "understanding",
    tags: [] as string[],
    resources: [] as CreateLogResource[],
    currentStep: 1,
  });

  // 編集フォーム状態
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editResources, setEditResources] = useState<
    {
      id: number;
      resourceType: string | null;
      resourceLink: string;
      description: string | null;
      fileName?: string;
      filePath?: string;
    }[]
  >([]);

  const { session: supabaseSession } = useAuthStore();

  const { logs = [], isLoading, mutate: mutateLogs } = useLogs(unitId);

  const handleCreateLogSubmit = async (formData: {
    title: string;
    learningTime: number;
    note: string;
    logDate: string;
    tags: string[];
    effectScore: number;
    effectType: string;
    resources: CreateLogResource[];
  }) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Supabase認証トークンを追加
      if (supabaseSession?.access_token) {
        headers.Authorization = `Bearer ${supabaseSession.access_token}`;
      }

      const response = await fetch(`/api/units/${unitId}/logs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: formData.title,
          learningTime: formData.learningTime,
          note: formData.note,
          logDate: formData.logDate,
          effectScore: formData.effectScore,
          effectType: formData.effectType,
          tags: formData.tags,
          resources: formData.resources,
        }),
      });

      if (!response.ok) {
        throw new Error("ログの作成に失敗しました");
      }

      toast.success("学習ログを作成しました");
      mutateLogs();
    } catch (error) {
      console.error("ログ作成エラー:", error);
      throw error;
    }
  };

  const handleEditLogSubmit = async (
    logId: number,
    formData: {
      title: string;
      learningTime: number;
      note: string;
      logDate: string;
      tags: string[];
      resources: CreateLogResource[];
      effectScore: number;
      effectType: string;
    }
  ) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Supabase認証トークンを追加
      if (supabaseSession?.access_token) {
        headers.Authorization = `Bearer ${supabaseSession.access_token}`;
      }

      const response = await fetch(`/api/units/${unitId}/logs/${logId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: formData.title,
          learningTime: formData.learningTime,
          note: formData.note,
          logDate: formData.logDate,
          effectScore: formData.effectScore,
          effectType: formData.effectType,
          tags: formData.tags,
          resources: formData.resources,
        }),
      });

      if (!response.ok) {
        throw new Error("ログの更新に失敗しました");
      }

      toast.success("学習ログを更新しました");
      mutateLogs();
    } catch (error) {
      console.error("ログ更新エラー:", error);
      toast.error("ログの更新に失敗しました");
    }
  };

  const handleDeleteLog = async (
    logId: number,
    setOpenMenuId: (id: number | null) => void
  ) => {
    if (!confirm("このログを削除してもよろしいですか？")) return;

    setDeletingLogIds((prev) => [...prev, logId]);
    setOpenMenuId(null);

    try {
      const response = await fetch(`/api/units/${unitId}/logs/${logId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("ログの削除に失敗しました");
      }

      toast.success("学習ログを削除しました");
      mutateLogs();
    } catch (error) {
      console.error("ログ削除エラー:", error);
      toast.error("ログの削除に失敗しました");
    } finally {
      setDeletingLogIds((prev) => prev.filter((id) => id !== logId));
    }
  };

  const menuRefs = React.useRef<{
    [key: number]: React.RefObject<HTMLDivElement>;
  }>({});

  return (
    <div className="mt-4 sm:mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">学習ログ</h2>
        <div className="flex gap-1 sm:gap-2">
          {session?.user?.id === userId && (
            <>
              <Button
                onClick={() => setIsCreatingLog(true)}
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">ログを追加</span>
              </Button>
              <div className="scale-90 sm:scale-100">
                <AdviceButton
                  unitId={unitId}
                  onAddComment={onAIAdvice}
                  userId={userId}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 作成モーダル */}
      <CreateLogModal
        open={isCreatingLog}
        onOpenChange={setIsCreatingLog}
        unitId={unitId}
        onSubmit={handleCreateLogSubmit}
        formData={createFormData}
        onFormDataChange={setCreateFormData}
      />

      {isLoading ? (
        <Loading text="読み込み中..." />
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          まだ学習ログがありません
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {logs.map((log) => (
              <Card
                key={log.id}
                id={`log-${log.id}`}
                className="p-4 scroll-mt-24"
              >
                <LogCard
                  log={log}
                  unitId={unitId}
                  session={session}
                  onEdit={() => {
                    setEditingLogId(log.id);
                    // 既存のタグ情報を編集状態に設定
                    setEditTags(log.tags?.map((tag) => tag.name) || []);
                    // 既存のリソース情報も編集状態に設定
                    setEditResources(
                      log.resources?.map((resource) => ({
                        id: resource.id,
                        resourceType: resource.resourceType,
                        resourceLink: resource.resourceLink,
                        description: resource.description,
                        fileName: resource.fileName,
                        filePath: resource.filePath,
                      })) || []
                    );
                  }}
                  onDelete={() => handleDeleteLog(log.id, setOpenMenuId)}
                  isDeleting={deletingLogIds.includes(log.id)}
                  menuRef={
                    menuRefs.current[log.id] ||
                    (menuRefs.current[log.id] = React.createRef())
                  }
                />
              </Card>
            ))}
          </div>

          {/* 編集モーダル */}
          {editingLogId && (
            <EditLogModal
              open={editingLogId !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingLogId(null);
                  // 編集状態をリセット
                  setEditTags([]);
                  setEditResources([]);
                }
              }}
              log={logs.find((log) => log.id === editingLogId)!}
              unitId={unitId}
              onUpdate={() => {
                setEditingLogId(null);
                // 編集状態をリセット
                setEditTags([]);
                setEditResources([]);
                mutateLogs();
              }}
              onSubmit={(form) => handleEditLogSubmit(editingLogId, form)}
              tags={editTags}
              setTags={setEditTags}
              resources={editResources}
              setResources={setEditResources}
            />
          )}

          {logs.length > 0 && <TableOfContents logs={logs} />}
        </>
      )}
    </div>
  );
});
