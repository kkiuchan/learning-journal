"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/useComments";
import { useLogs } from "@/hooks/useLogs";
import { Unit } from "@/types";
import { translateUnitStatus } from "@/utils/i18n";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ExternalLink,
  File,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import useSWR from "swr";
import CreateLogForm from "./components/CreateLogForm";
import EditLogForm from "./components/EditLogForm";

// グローバルWindow型を拡張
declare global {
  interface Window {
    clearSWCache?: () => Promise<void>;
  }
}

export default function UnitDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth/login");
    },
  });

  // SWRを使用してユニットを取得
  const {
    data: unitData,
    error: unitError,
    mutate: mutateUnit,
  } = useSWR<{ data: Unit }>(`/api/units/${id}`, undefined);

  // SWRを使用してログを取得
  const { logs, isLoading: logsLoading, mutate: mutateLogs } = useLogs(id);

  // SWRを使用してコメントを取得
  const [commentPage, setCommentPage] = useState(1);
  const {
    comments,
    pagination,
    isLoading: commentsLoading,
    mutate: mutateComments,
  } = useComments({
    unitId: id,
    page: commentPage,
    limit: 10,
  });

  const [newComment, setNewComment] = useState("");
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  const handleDelete = async () => {
    if (!confirm("このユニットを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
        next: { tags: [`unit-${id}`, "unit", "unit-list"] },
      });

      if (response.ok) {
        router.push("/units");
      } else {
        const data = await response.json();
        console.error("ユニットの削除に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/units/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: newComment,
        }),
        next: {
          tags: [`unit-${id}`, "unit", "unit-list", "comment", "comment-list"],
        },
      });

      if (response.ok) {
        setNewComment("");
        mutateComments();
      } else {
        const data = await response.json();
        console.error("コメントの作成に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("このコメントを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
        method: "DELETE",
        next: {
          tags: [
            `unit-${id}`,
            "unit",
            "unit-list",
            "comment",
            "comment-list",
            `comment-${commentId}`,
          ],
        },
      });

      if (response.ok) {
        mutateComments();
      } else {
        const data = await response.json();
        console.error("コメントの削除に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingCommentContent.trim()) return;

    try {
      const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: editingCommentContent,
        }),
        next: {
          tags: [
            `unit-${id}`,
            "unit",
            "unit-list",
            "comment",
            "comment-list",
            `comment-${commentId}`,
          ],
        },
      });

      if (response.ok) {
        setEditingCommentId(null);
        setEditingCommentContent("");
        mutateComments();
      } else {
        const data = await response.json();
        console.error("コメントの更新に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleLike = async () => {
    if (!unitData?.data) return;

    const unit = unitData.data;

    // 楽観的更新
    const previousUnit = { ...unit };
    mutateUnit(
      {
        data: {
          ...unit,
          isLiked: !unit.isLiked,
          _count: {
            ...unit._count,
            unitLikes: unit.isLiked
              ? unit._count.unitLikes - 1
              : unit._count.unitLikes + 1,
          },
        },
      },
      false
    );

    try {
      const response = await fetch(`/api/units/${id}/like`, {
        method: unit.isLiked ? "DELETE" : "POST",
        next: { tags: [`unit-${id}`, "unit", "unit-list"] },
      });

      if (!response.ok) {
        // エラーが発生した場合は元に戻す
        mutateUnit({ data: previousUnit }, false);
        const data = await response.json();
        console.error("いいねの更新に失敗しました:", data.error);
      }
    } catch (error) {
      // エラーが発生した場合は元に戻す
      mutateUnit({ data: previousUnit }, false);
      console.error("エラーが発生しました:", error);
    }
  };

  const handleLoadMoreComments = () => {
    if (pagination && commentPage < pagination.totalPages) {
      setCommentPage((prev) => prev + 1);
    }
  };

  if (unitError) {
    return <div className="text-red-500">ユニットの取得に失敗しました</div>;
  }

  if (!unitData?.data) {
    return <div>ユニットが見つかりません</div>;
  }

  const unit = unitData.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{unit.title}</h1>
            <Badge variant="outline" className="mb-4">
              {translateUnitStatus(unit.status)}
            </Badge>
          </div>
          {session?.user?.id === unit.userId && (
            <div className="flex gap-2">
              <Link href={`/units/${id}/edit`}>
                <Button variant="outline" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {unit.learningGoal && (
            <div>
              <h2 className="text-lg font-semibold mb-2">学習目標</h2>
              <p className="text-muted-foreground">{unit.learningGoal}</p>
            </div>
          )}

          {unit.preLearningState && (
            <div>
              <h2 className="text-lg font-semibold mb-2">事前の学習状態</h2>
              <p className="text-muted-foreground">{unit.preLearningState}</p>
            </div>
          )}

          {unit.reflection && (
            <div>
              <h2 className="text-lg font-semibold mb-2">振り返り</h2>
              <p className="text-muted-foreground">{unit.reflection}</p>
            </div>
          )}

          {unit.nextAction && (
            <div>
              <h2 className="text-lg font-semibold mb-2">次のアクション</h2>
              <p className="text-muted-foreground">{unit.nextAction}</p>
            </div>
          )}

          {(unit.startDate || unit.endDate) && (
            <div>
              <h2 className="text-lg font-semibold mb-2">学習期間</h2>
              <p className="text-muted-foreground">
                {unit.startDate &&
                  `開始: ${format(new Date(unit.startDate), "yyyy/MM/dd", {
                    locale: ja,
                  })}`}
                {unit.startDate && unit.endDate && " 〜 "}
                {unit.endDate &&
                  `終了: ${format(new Date(unit.endDate), "yyyy/MM/dd", {
                    locale: ja,
                  })}`}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {unit.tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 ${
                unit.isLiked ? "text-red-500" : "text-gray-500"
              }`}
            >
              <Heart className={unit.isLiked ? "fill-current" : ""} />
              <span>{unit._count.unitLikes}</span>
            </button>
            <div className="flex items-center gap-1 text-gray-500">
              <MessageCircle />
              <span>{unit._count.comments}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 学習ログ */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">学習ログ</h2>
          <div className="flex gap-2">
            {session?.user?.id === unit.userId && (
              <Button onClick={() => setIsCreatingLog(true)}>ログを追加</Button>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await window.clearSWCache?.();
                  // サービスワーカーを登録解除
                  if ("serviceWorker" in navigator) {
                    const registrations =
                      await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                      await registration.unregister();
                      console.log(
                        "ServiceWorker 登録解除: ",
                        registration.scope
                      );
                    }
                  }

                  // キャッシュを削除
                  if ("caches" in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                      cacheNames.map((cacheName) => caches.delete(cacheName))
                    );
                  }

                  // ログを再取得
                  mutateLogs();

                  // ページをリロード
                  window.location.reload();
                } catch (error) {
                  console.error("更新中にエラーが発生しました:", error);
                  alert(
                    "更新中にエラーが発生しました。ページを再読み込みします。"
                  );
                  window.location.reload();
                }
              }}
              title="キャッシュを削除して最新データを読み込み"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
          </div>
        </div>

        {isCreatingLog && (
          <CreateLogForm
            unitId={id}
            onCancel={() => setIsCreatingLog(false)}
            onSuccess={() => {
              setIsCreatingLog(false);
              mutateLogs();
            }}
          />
        )}

        {logsLoading ? (
          <div>読み込み中...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだ学習ログがありません
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="p-4">
                {editingLogId === log.id ? (
                  <EditLogForm
                    log={log}
                    unitId={id}
                    onCancel={() => setEditingLogId(null)}
                    onUpdate={() => {
                      setEditingLogId(null);
                      mutateLogs();
                    }}
                  />
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{log.title}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(log.logDate), "yyyy/MM/dd", {
                            locale: ja,
                          })}
                        </p>
                      </div>
                      {session?.user?.id === String(log.userId) && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingLogId(log.id)}
                          >
                            編集
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (
                                !confirm("このログを削除してもよろしいですか？")
                              )
                                return;

                              try {
                                const response = await fetch(
                                  `/api/units/${id}/logs/${log.id}`,
                                  {
                                    method: "DELETE",
                                    next: {
                                      tags: [
                                        `unit-${id}`,
                                        "unit",
                                        "unit-list",
                                        "log",
                                        "log-list",
                                        `log-${log.id}`,
                                      ],
                                    },
                                  }
                                );

                                if (response.ok) {
                                  // キャッシュを強制的に更新するために空のデータを返す
                                  await mutateLogs(
                                    (current) => {
                                      // 削除されたログを除外した新しいログ配列を作成
                                      if (!current) return current;
                                      return {
                                        ...current,
                                        data: current.data.filter(
                                          (l) => l.id !== log.id
                                        ),
                                      };
                                    },
                                    {
                                      revalidate: true, // サーバーからの再検証も実行
                                      populateCache: true, // キャッシュを更新
                                    }
                                  );
                                } else {
                                  const data = await response.json();
                                  console.error(
                                    "ログの削除に失敗しました:",
                                    data.error
                                  );
                                }
                              } catch (error) {
                                console.error("エラーが発生しました:", error);
                              }
                            }}
                          >
                            削除
                          </Button>
                        </div>
                      )}
                    </div>
                    {log.note && (
                      <div className="mt-2 whitespace-pre-wrap">{log.note}</div>
                    )}
                    {log.learningTime && (
                      <div className="mt-2 text-sm text-gray-500">
                        学習時間: {log.learningTime}分
                      </div>
                    )}
                    {log.logTags && log.logTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {log.logTags.map((logTag) => (
                          <Badge
                            key={logTag.tag.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {logTag.tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {Array.isArray(log.resources) &&
                      log.resources.length > 0 && (
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
                                  <LinkIcon className="h-4 w-4 mt-0.5 text-blue-500" />
                                )}
                                <div className="flex-1">
                                  <a
                                    href={resource.resourceLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline flex items-center gap-1"
                                  >
                                    {resource.description ||
                                      resource.resourceLink}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  {resource.fileName && (
                                    <span className="text-xs text-gray-500 block">
                                      ファイル名: {resource.fileName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* コメント */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">コメント</h2>

        {session?.user && (
          <form onSubmit={handleCreateComment} className="mb-6">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              className="mb-2"
            />
            <Button type="submit" disabled={!newComment.trim()}>
              コメントする
            </Button>
          </form>
        )}

        {commentsLoading ? (
          <div>読み込み中...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだコメントがありません
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(comment.createdAt), "yyyy/MM/dd HH:mm", {
                        locale: ja,
                      })}
                    </p>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <Textarea
                          value={editingCommentContent}
                          onChange={(e) =>
                            setEditingCommentContent(e.target.value)
                          }
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(comment.id)}
                          >
                            更新
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentContent("");
                            }}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    )}
                  </div>
                  {session?.user?.id && session.user.id === comment.user.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingCommentContent(comment.comment);
                        }}
                      >
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        削除
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* もっと見るボタン */}
        {pagination && commentPage < pagination.totalPages && (
          <button onClick={handleLoadMoreComments}>もっと見る</button>
        )}
      </div>
    </div>
  );
}
