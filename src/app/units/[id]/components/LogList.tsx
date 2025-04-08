"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Log } from "@/types/log";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ExternalLink, File, Link, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

// デバッグ用にwindowオブジェクトを拡張
declare global {
  interface Window {
    debugLogs: Log[] | null;
    rawApiResponse: Record<string, unknown> | null;
    fetchLogsManually: () => Promise<void>;
  }
}

// 初期化
if (typeof window !== "undefined") {
  window.debugLogs = null;
  window.rawApiResponse = null;
}

interface LogListProps {
  unitId: number;
}

export function LogList({ unitId }: LogListProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (typeof window !== "undefined") {
      console.log("==== Log取得開始 ====");
      console.log("unitId:", unitId);
    }

    try {
      // API URLの構築
      const url = `/api/units/${unitId}/logs`;
      console.log("API URL:", url);

      // API呼び出し
      console.log("fetch開始...");
      const response = await fetch(url);
      console.log("fetch完了, status:", response.status);

      if (!response.ok) {
        console.error("APIエラー:", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`ログの取得に失敗しました: ${response.status}`);
      }

      // レスポンスのJSON解析
      console.log("レスポンスデータ取得中...");
      const data = await response.json();
      console.log("レスポンスデータ取得完了");

      // グローバル変数に格納
      if (typeof window !== "undefined") {
        window.rawApiResponse = data;
        if (data && data.data) {
          window.debugLogs = data.data;
          console.log("window.debugLogsに格納完了:", data.data.length, "件");
        } else {
          console.warn("データが空か不正な形式です");
          window.debugLogs = [];
        }
      }

      // データチェック
      if (!data) {
        console.error("APIレスポンスが空です");
        throw new Error("レスポンスデータが空です");
      }

      if (!data.data) {
        console.error("data.dataがありません:", data);
        throw new Error("データ形式が不正です");
      }

      // 結果表示
      console.log(`取得成功: ${data.data.length}件のログ`);

      if (data.data.length > 0) {
        const firstLog = data.data[0];
        console.log("最初のログのプロパティ:", Object.keys(firstLog));

        if ("resources" in firstLog) {
          console.log("リソース情報:", firstLog.resources);
        } else {
          console.warn("リソース情報がありません");
        }
      } else {
        console.log("ログデータがありません");
      }

      // ステート更新
      setLogs(data.data);
      console.log("==== Log取得完了 ====");
    } catch (err) {
      console.error("==== Log取得エラー ====", err);
      setError(err instanceof Error ? err.message : "ログの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // グローバルに関数を公開（デバッグ用）
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.fetchLogsManually = fetchLogs;
      console.log(
        "デバッグ用: window.fetchLogsManually() でログを再取得できます"
      );
    }

    fetchLogs();

    return () => {
      if (typeof window !== "undefined") {
        window.fetchLogsManually = async () => {
          console.log("コンポーネントはアンマウント済みです");
        };
      }
    };
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
      console.error("ログ削除エラー:", err);
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

          {log.logTags && log.logTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {log.logTags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-3 border-t pt-3">
            <h4 className="text-sm font-medium">リソース情報</h4>
            <pre className="text-xs bg-gray-100 p-2 mt-1 overflow-auto rounded">
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>

          {/* console.logの代わりにコメントで表示 */}
          {/* ログID {log.id} のリソース: {JSON.stringify(log.resources)} */}

          {Array.isArray(log.resources) && log.resources.length > 0 ? (
            <div className="space-y-2 mt-3 border-t pt-3">
              <h4 className="text-sm font-medium">
                リソース ({log.resources.length}件)
              </h4>
              <div className="space-y-2">
                {log.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="text-sm flex items-start gap-2 bg-gray-50 p-2 rounded"
                  >
                    {resource.resourceType === "file" ? (
                      <File className="h-4 w-4 mt-0.5 text-blue-500" />
                    ) : (
                      <Link className="h-4 w-4 mt-0.5 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <a
                        href={resource.resourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-1"
                      >
                        {resource.description || resource.resourceLink}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {resource.fileName && (
                        <span className="text-xs text-gray-500 block">
                          ファイル名: {resource.fileName}
                        </span>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        リソースタイプ: {resource.resourceType || "不明"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-3 border-t pt-3">
              リソースなし
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
