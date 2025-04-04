"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Log } from "@/types/log";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LogListProps {
  unitId: number;
}

export function LogList({ unitId }: LogListProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/units/${unitId}/logs`);
      if (!response.ok) {
        throw new Error("ログの取得に失敗しました");
      }
      const data = await response.json();
      setLogs(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [unitId]);

  const handleDelete = async (logId: number) => {
    if (!confirm("このログを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/units/${unitId}/logs/${logId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("ログの削除に失敗しました");
      }

      setLogs(logs.filter((log) => log.id !== logId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログの削除に失敗しました");
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (logs.length === 0) {
    return <div className="text-gray-500">ログがありません</div>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{log.title}</h3>
              <div className="text-sm text-gray-500">
                {format(new Date(log.logDate), "yyyy年MM月dd日 HH:mm", {
                  locale: ja,
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(log.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {log.learningTime && (
            <div className="text-sm text-gray-600 mb-2">
              学習時間: {log.learningTime}分
            </div>
          )}

          {log.note && (
            <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
              {log.note}
            </div>
          )}

          {log.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {log.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {log.resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">リソース</h4>
              <div className="space-y-2">
                {log.resources.map((resource) => (
                  <div key={resource.id} className="text-sm">
                    {resource.resourceType && (
                      <span className="font-medium">
                        {resource.resourceType}:{" "}
                      </span>
                    )}
                    <a
                      href={resource.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {resource.resourceLink}
                    </a>
                    {resource.description && (
                      <div className="text-gray-600">
                        {resource.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
