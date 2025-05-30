"use client";

import { AdviceButton } from "@/components/AdviceButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading";
import { useLogs } from "@/hooks/useLogs";
import { List, Plus, Wand2 } from "lucide-react";
import { Session } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import CreateLogForm from "./CreateLogForm";
import EditLogForm from "./EditLogForm";
import LogCard from "./LogCard";
import { TableOfContents } from "./TableOfContents";
import WizardLogForm from "./WizardLogForm";

interface LogsSectionProps {
  unitId: string;
  userId: string;
  session: Session | null;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onAIAdvice?: () => void;
}

// WizardLogFormのResource型と一致させる
interface WizardResource {
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

// CreateLogFormのResource型
interface CreateLogResource {
  id?: number;
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
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
  const [useWizardForm, setUseWizardForm] = useState(true); // デフォルトはウィザード形式
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [deletingLogIds, setDeletingLogIds] = useState<number[]>([]);

  // フォーム状態
  const [createTags, setCreateTags] = useState<string[]>([]);
  const [createResources, setCreateResources] = useState<CreateLogResource[]>(
    []
  );
  const [tags, setTags] = useState<string[]>([]);
  const [resources, setResources] = useState<CreateLogResource[]>([]);
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

  const { logs, isLoading, mutate: mutateLogs } = useLogs(unitId);

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
      const response = await fetch(`/api/units/${unitId}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      const response = await fetch(`/api/units/${unitId}/logs/${logId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
        <div className="mb-6">
          {/* フォーム切り替えボタン */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">学習ログを作成</h3>
            <div className="flex items-center gap-2">
              <Button
                variant={useWizardForm ? "default" : "outline"}
                size="sm"
                onClick={() => setUseWizardForm(true)}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                ウィザード
              </Button>
              <Button
                variant={!useWizardForm ? "default" : "outline"}
                size="sm"
                onClick={() => setUseWizardForm(false)}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                従来形式
              </Button>
            </div>
          </div>

          {useWizardForm ? (
            <WizardLogForm
              unitId={unitId}
              onCancel={() => {
                setIsCreatingLog(false);
                setCreateTags([]);
                setCreateResources([]);
              }}
              onSuccess={() => {
                setIsCreatingLog(false);
                setCreateTags([]);
                setCreateResources([]);
              }}
              onSubmit={handleCreateLogSubmit}
            />
          ) : (
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
        </div>
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
                <LogCard
                  log={log}
                  unitId={unitId}
                  session={session}
                  onEdit={() => setEditingLogId(log.id)}
                  onDelete={() => handleDeleteLog(log.id, setOpenMenuId)}
                  isDeleting={deletingLogIds.includes(log.id)}
                />
              </Card>
            ))}
          </div>

          {/* 編集モーダル */}
          <Dialog
            open={editingLogId !== null}
            onOpenChange={(open) => !open && setEditingLogId(null)}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>学習ログを編集</DialogTitle>
              </DialogHeader>
              {editingLogId && (
                <EditLogForm
                  log={logs.find((log) => log.id === editingLogId)!}
                  unitId={unitId}
                  onCancel={() => setEditingLogId(null)}
                  onUpdate={() => {
                    setEditingLogId(null);
                    mutateLogs();
                  }}
                  onSubmit={(form) => handleEditLogSubmit(editingLogId, form)}
                  tags={editTags}
                  setTags={setEditTags}
                  resources={editResources}
                  setResources={setEditResources}
                />
              )}
            </DialogContent>
          </Dialog>

          {logs.length > 0 && <TableOfContents logs={logs} />}
        </>
      )}
    </div>
  );
}
