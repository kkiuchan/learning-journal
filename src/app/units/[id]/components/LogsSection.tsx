"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useLogs } from "@/hooks/useLogs";
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
}

export function LogsSection({
  unitId,
  userId,
  session,
  openMenuId,
  setOpenMenuId,
}: LogsSectionProps) {
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const { logs, isLoading, mutate: mutateLogs } = useLogs(unitId);

  return (
    <div className="mt-4 sm:mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">学習ログ</h2>
        <div className="flex gap-2">
          {session?.user?.id === userId && (
            <Button onClick={() => setIsCreatingLog(true)}>ログを追加</Button>
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
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
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
