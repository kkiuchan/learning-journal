"use client";

import { AdviceButton } from "@/components/AdviceButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { mutateDashboard } from "@/hooks/useDashboard";
import { useLogs } from "@/hooks/useLogs";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
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

  // ✅ 作成ハンドラーをメモ化
  const handleCreateLogSubmit = useCallback(
    async (formData: {
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

        const newLog = await response.json();
        toast.success("学習ログを作成しました");

        // 楽観的更新で新しいログを即座に追加
        mutateLogs(
          (currentData: { data: any[] } | undefined) => {
            if (!currentData?.data) return currentData;
            return {
              ...currentData,
              data: [newLog.data, ...currentData.data], // 新しいログを先頭に追加
            };
          },
          false // revalidateをfalseにしてUIのみ更新
        );

        // 少し遅延してサーバーデータを再検証
        setTimeout(() => {
          mutateLogs();
        }, 100);

        // ダッシュボードのキャッシュも更新
        mutateDashboard();

        setIsCreatingLog(false);
      } catch (error) {
        console.error("ログ作成エラー:", error);
        toast.error("ログの作成に失敗しました");
      }
    },
    [unitId, supabaseSession?.access_token, mutateLogs]
  );

  // ✅ 編集ハンドラーをメモ化
  const handleEditLogSubmit = useCallback(
    async (
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

        const updatedLog = await response.json();
        toast.success("学習ログを更新しました");

        // 楽観的更新で編集されたログを即座に反映
        mutateLogs(
          (currentData: { data: any[] } | undefined) => {
            if (!currentData?.data) return currentData;
            return {
              ...currentData,
              data: currentData.data.map((log: any) =>
                log.id === logId ? updatedLog.data : log
              ),
            };
          },
          false // revalidateをfalseにしてUIのみ更新
        );

        // 少し遅延してサーバーデータを再検証
        setTimeout(() => {
          mutateLogs();
        }, 100);

        // ダッシュボードのキャッシュも更新
        mutateDashboard();
      } catch (error) {
        console.error("ログ更新エラー:", error);
        toast.error("ログの更新に失敗しました");
      }
    },
    [unitId, supabaseSession?.access_token, mutateLogs]
  );

  // ✅ 削除ハンドラーをメモ化
  const handleDeleteLog = useCallback(
    async (logId: number) => {
      if (!confirm("このログを削除してもよろしいですか？")) return;

      console.log("🗑️ 削除開始:", logId);
      setDeletingLogIds((prev) => [...prev, logId]);
      setOpenMenuId(null);

      // 楽観的更新: 削除前にUIから即座に削除
      const previousData = logs;
      mutateLogs(
        (currentData: { data: any[] } | undefined) => {
          if (!currentData?.data) return currentData;
          console.log("🔄 楽観的更新: ログを削除", logId);
          return {
            ...currentData,
            data: currentData.data.filter((log: any) => log.id !== logId),
          };
        },
        false // revalidateをfalseにして、まずUIだけ更新
      );

      try {
        console.log(
          "🌐 API削除リクエスト送信:",
          `/api/units/${unitId}/logs/${logId}`
        );

        const response = await fetch(`/api/units/${unitId}/logs/${logId}`, {
          method: "DELETE",
        });

        console.log("📡 API削除レスポンス:", response.status, response.ok);

        if (!response.ok) {
          const errorData = await response.text();
          console.error("❌ API削除エラー:", errorData);
          throw new Error("ログの削除に失敗しました");
        }

        const responseData = await response.json();
        console.log("✅ API削除成功:", responseData);

        toast.success("学習ログを削除しました");

        // 削除成功時は楽観的更新をそのまま維持（キャッシュ再取得しない）
        console.log("✅ 削除完了: 楽観的更新を維持");

        // 少し遅延してサーバーデータを再検証
        setTimeout(() => {
          mutateLogs();
        }, 100);

        // ダッシュボードのキャッシュも更新
        mutateDashboard();
      } catch (error) {
        console.error("❌ ログ削除エラー:", error);
        toast.error("ログの削除に失敗しました");

        // エラー時は楽観的更新を取り消し（削除されたログを復元）
        console.log("🔄 楽観的更新を取り消し");
        mutateLogs((currentData: { data: any[] } | undefined) => {
          if (!currentData?.data || !previousData) return currentData;
          // 元のデータを復元
          return {
            ...currentData,
            data: previousData,
          };
        }, false);
      } finally {
        setDeletingLogIds((prev) => prev.filter((id) => id !== logId));
        console.log("🏁 删除処理完了:", logId);
      }
    },
    [unitId, mutateLogs, logs, setOpenMenuId]
  );

  // ✅ 編集開始ハンドラーをメモ化
  const handleEditLog = useCallback((log: any) => {
    setEditingLogId(log.id);
    // 既存のタグ情報を編集状態に設定
    setEditTags(log.tags?.map((tag: any) => tag.name) || []);
    // 既存のリソース情報も編集状態に設定
    setEditResources(
      log.resources?.map((resource: any) => ({
        id: resource.id,
        resourceType: resource.resourceType,
        resourceLink: resource.resourceLink,
        description: resource.description,
        fileName: resource.fileName,
        filePath: resource.filePath,
      })) || []
    );
  }, []);

  // ✅ 編集モーダルの開閉ハンドラーをメモ化
  const handleEditModalOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setEditingLogId(null);
      // 編集状態をリセット
      setEditTags([]);
      setEditResources([]);
    }
  }, []);

  // ✅ 編集完了ハンドラーをメモ化
  const handleEditUpdate = useCallback(() => {
    setEditingLogId(null);
    // 編集状態をリセット
    setEditTags([]);
    setEditResources([]);
    // 楽観的更新により既にUIは更新済みなので、追加のキャッシュ更新は不要
  }, []);

  // ✅ 編集送信ハンドラーをメモ化
  const handleEditSubmit = useCallback(
    async (form: any) => {
      if (editingLogId) {
        await handleEditLogSubmit(editingLogId, form);
      }
    },
    [editingLogId, handleEditLogSubmit]
  );

  // ✅ 編集中のログをメモ化
  const editingLog = useMemo(() => {
    return editingLogId ? logs.find((log) => log.id === editingLogId) : null;
  }, [editingLogId, logs]);

  // ✅ 削除状態をメモ化
  const deletingStates = useMemo(() => {
    const states: Record<number, boolean> = {};
    logs.forEach((log) => {
      states[log.id] = deletingLogIds.includes(log.id);
    });
    return states;
  }, [logs, deletingLogIds]);

  // ✅ openMenuIdのRefを作成して依存を排除
  const openMenuIdRef = useRef(openMenuId);
  openMenuIdRef.current = openMenuId;

  // ✅ 完全に安定したメニュートグル関数を作成
  const menuToggleFunctions = useMemo(() => {
    const functions: Record<number, () => void> = {};
    logs.forEach((log) => {
      functions[log.id] = () => {
        const currentOpenMenuId = openMenuIdRef.current;
        const newMenuId = currentOpenMenuId === log.id ? null : log.id;
        setOpenMenuId(newMenuId);
      };
    });
    return functions;
  }, [logs, setOpenMenuId]);

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
                  onEdit={handleEditLog}
                  onDeleteLog={handleDeleteLog}
                  isDeleting={deletingStates[log.id]}
                  isMenuOpen={openMenuId === log.id}
                  onMenuToggle={menuToggleFunctions[log.id]}
                />
              </Card>
            ))}
          </div>

          {/* 編集モーダル */}
          {editingLogId && editingLog && (
            <EditLogModal
              open={editingLogId !== null}
              onOpenChange={handleEditModalOpenChange}
              log={editingLog}
              unitId={unitId}
              onUpdate={handleEditUpdate}
              onSubmit={handleEditSubmit}
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
