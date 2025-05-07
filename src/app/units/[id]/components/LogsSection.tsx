"use client";

import { AdviceButton } from "@/components/AdviceButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useLogs } from "@/hooks/useLogs";
import { Plus } from "lucide-react";
import { Session } from "next-auth";
import { useState } from "react";
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
          }}
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
                  />
                ) : (
                  <LogCard
                    log={log}
                    unitId={unitId}
                    session={session}
                    onEdit={() => setEditingLogId(log.id)}
                    onDelete={mutateLogs}
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
