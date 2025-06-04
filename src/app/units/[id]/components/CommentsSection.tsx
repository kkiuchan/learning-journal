"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import { useMenu } from "@/contexts/MenuContext";
import { AuthSession } from "@/types/auth";
import { CommentDTO } from "@/types/comment";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface CommentsSectionProps {
  unitId: string;
  userId: string;
  session: AuthSession | null;
  comments: CommentDTO[];
  pagination: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  } | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onCreateComment: (comment: string) => Promise<void>;
  onUpdateComment: (commentId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  isDeleting: boolean;
}

export function CommentsSection({
  unitId,
  userId,
  session,
  comments,
  pagination,
  isLoading,
  onPageChange,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  isDeleting,
}: CommentsSectionProps) {
  const { openMenuId, setOpenMenuId } = useMenu();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [expandedComments, setExpandedComments] = useState<number[]>([]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    try {
      await onCreateComment(newComment);
      setNewComment("");
    } catch (error) {
      // エラー処理は親コンポーネントで行う
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingCommentContent.trim()) return;

    try {
      await onUpdateComment(commentId, editingCommentContent);
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (error) {
      // エラー処理は親コンポーネントで行う
    }
  };

  const toggleCommentExpansion = (commentId: number) => {
    setExpandedComments((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId]
    );
  };

  return (
    <div id="comments-section" className="mt-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">コメント</h2>

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

      {isLoading ? (
        <div>読み込み中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          まだコメントがありません
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {comment.user.image && (
                      <UserAvatar
                        imageUrl={comment.user.image}
                        userName={comment.user.name}
                        size="md"
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {comment.user.name || "ユーザー"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(comment.createdAt),
                            "yyyy/MM/dd HH:mm",
                            {
                              locale: ja,
                            }
                          )}
                        </span>
                      </div>
                      {comment.user.id === "ai-assistant" && (
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs bg-blue-50 text-blue-600 border-blue-200"
                        >
                          AIアドバイス
                        </Badge>
                      )}
                    </div>
                  </div>
                  {session?.user?.id === comment.user.id && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 menu-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === comment.id ? null : comment.id
                          );
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {openMenuId === comment.id && (
                        <div className="absolute right-0 mt-1 bg-background rounded-md shadow-lg z-10 border transition-all duration-200 ease-in-out min-w-[120px] menu-content">
                          <div className="py-1">
                            <button
                              className="w-full text-left px-4 py-2 text-foreground hover:bg-accent flex items-center gap-2 menu-action-button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentContent(comment.comment);
                                setOpenMenuId(null);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                              編集
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-destructive hover:bg-accent flex items-center gap-2 menu-action-button"
                              onClick={() => {
                                onDeleteComment(comment.id);
                                setOpenMenuId(null);
                              }}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3 w-3" />
                              {isDeleting ? "削除中..." : "削除"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div className="mt-2">
                    <Textarea
                      value={editingCommentContent}
                      onChange={(e) => setEditingCommentContent(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editingCommentContent.trim()}
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
                  <div className="mt-1">
                    <div
                      className={`whitespace-pre-wrap text-sm sm:text-base ${
                        !expandedComments.includes(comment.id) &&
                        comment.comment.length > 200
                          ? "line-clamp-4"
                          : ""
                      }`}
                    >
                      {comment.comment}
                    </div>
                    {comment.comment.length > 200 && (
                      <button
                        onClick={() => toggleCommentExpansion(comment.id)}
                        className="text-xs sm:text-sm text-blue-500 mt-2 hover:underline"
                      >
                        {expandedComments.includes(comment.id)
                          ? "折りたたむ"
                          : "続きを読む"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.currentPage < pagination.totalPages && (
        <Button
          variant="outline"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          className="mt-4 w-full"
        >
          もっと見る
        </Button>
      )}
    </div>
  );
}
