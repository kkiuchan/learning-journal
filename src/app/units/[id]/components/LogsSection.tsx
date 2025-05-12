"use client";

import { AdviceButton } from "@/components/AdviceButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useLogs } from "@/hooks/useLogs";
import { Plus } from "lucide-react";
import { Session } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CreateLogForm from "./CreateLogForm";
import EditLogForm from "./EditLogForm";
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

export function LogsSection({
  unitId,
  userId,
  session,
  openMenuId,
  setOpenMenuId,
  onAIAdvice,
}: LogsSectionProps) {
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const { logs, isLoading, mutate: mutateLogs } = useLogs(unitId);
  const [tags, setTags] = useState<string[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [createTags, setCreateTags] = useState<string[]>([]);
  const [createResources, setCreateResources] = useState<any[]>([]);
  const [deletingLogIds, setDeletingLogIds] = useState<number[]>([]);

  useEffect(() => {
    if (editingLogId !== null) {
      const editingLog = logs.find((l) => l.id === editingLogId);
      if (editingLog) {
        setTags(editingLog.tags?.map((tag) => tag.name) || []);
        setResources(editingLog.resources || []);
      }
    }
  }, [editingLogId, logs]);

  const handleEditLogSubmit = async (logId: number, form: any) => {
    try {
      const response = await fetch(`/api/units/${unitId}/logs/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        next: {
          tags: [
            `unit-${unitId}`,
            "unit",
            "unit-list",
            "log",
            "log-list",
            `log-${logId}`,
          ],
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "Log not found") {
          alert(
            "このログは削除された可能性があります。ページを更新してください。"
          );
          setEditingLogId(null);
          return;
        }
        throw new Error("ログの更新に失敗しました");
      }
      mutateLogs();
      setEditingLogId(null);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "ログの更新に失敗しました"
      );
    }
  };

  const handleCreateLogSubmit = async (form: any) => {
    try {
      const response = await fetch(`/api/units/${unitId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("ログの作成に失敗しました");
      mutateLogs();
      setCreateTags([]);
      setCreateResources([]);
      setIsCreatingLog(false);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "ログの作成に失敗しました"
      );
    }
  };

  const handleDeleteLog = async (
    logId: number,
    setOpenMenuId?: (id: number | null) => void
  ) => {
    if (!confirm("このログを削除してもよろしいですか？")) return;
    if (deletingLogIds.includes(logId)) return;
    setDeletingLogIds((prev) => [...prev, logId]);
    try {
      const response = await fetch(`/api/units/${unitId}/logs/${logId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        mutateLogs();
        if (setOpenMenuId) setOpenMenuId(null);
        toast.success("ログを削除しました");
      } else {
        const data = await response.json();
        throw new Error(data.error || "ログの削除に失敗しました");
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error(
        error instanceof Error ? error.message : "ログの削除に失敗しました"
      );
    } finally {
      setDeletingLogIds((prev) => prev.filter((id) => id !== logId));
    }
  };

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

      {isCreatingLog && (
        <CreateLogForm
          unitId={unitId}
          onCancel={() => setIsCreatingLog(false)}
          onSuccess={() => {
            setIsCreatingLog(false);
            mutateLogs();
            setCreateTags([]);
            setCreateResources([]);
          }}
          tags={createTags}
          setTags={setCreateTags}
          resources={createResources}
          setResources={setCreateResources}
          onSubmit={handleCreateLogSubmit}
        />
      )}

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
                {editingLogId === log.id ? (
                  <EditLogForm
                    log={log}
                    unitId={unitId}
                    onCancel={() => setEditingLogId(null)}
                    onUpdate={() => {
                      setEditingLogId(null);
                      mutateLogs();
                    }}
                    onSubmit={(form) => handleEditLogSubmit(log.id, form)}
                    tags={tags}
                    setTags={setTags}
                    resources={resources}
                    setResources={setResources}
                  />
                ) : (
                  <LogCard
                    log={log}
                    unitId={unitId}
                    session={session}
                    onEdit={() => setEditingLogId(log.id)}
                    onDelete={() => handleDeleteLog(log.id, setOpenMenuId)}
                    isDeleting={deletingLogIds.includes(log.id)}
                  />
                )}
              </Card>
            ))}
          </div>
          {logs.length > 0 && <TableOfContents logs={logs} />}
        </>
      )}
    </div>
  );
}
