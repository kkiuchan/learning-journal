"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface ErrorLog {
  id: number;
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/logs?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error("エラーログの取得に失敗しました");
      }

      const data = await response.json();
      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">エラーログ管理</h1>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">読み込み中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          エラーログはありません
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="mb-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">ID: {log.id}</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(log.timestamp), "yyyy/MM/dd HH:mm:ss", {
                        locale: ja,
                      })}
                    </span>
                  </div>
                  <h3 className="text-red-600 font-medium mt-1">
                    {log.message}
                  </h3>
                </div>

                {log.url && (
                  <div className="text-sm mb-2">
                    <span className="font-medium">URL: </span>
                    {log.url}
                  </div>
                )}

                {log.digest && (
                  <div className="text-sm mb-2">
                    <span className="font-medium">Digest: </span>
                    {log.digest}
                  </div>
                )}

                {log.userAgent && (
                  <div className="text-sm mb-2">
                    <span className="font-medium">User Agent: </span>
                    <span className="text-xs">{log.userAgent}</span>
                  </div>
                )}

                {log.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">
                      スタックトレース
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              前へ
            </Button>
            <div>
              {page} / {totalPages} ページ
            </div>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              variant="outline"
            >
              次へ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
