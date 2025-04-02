"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Comment, Unit } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

export default function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth/signin");
    },
  });
  const [unit, setUnit] = useState<Unit | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUnit();
      fetchComments();
    }
  }, [id, status]);

  const fetchUnit = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/units/${id}`);
      if (!response.ok) {
        throw new Error("ユニットの取得に失敗しました");
      }
      const data = await response.json();
      console.log("Fetched unit:", data.data); // デバッグ用
      setUnit(data.data);
    } catch (error) {
      console.error("エラーが発生しました:", error);
      setError(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/units/${id}/comments`);
      const data = await response.json();
      if (response.ok) {
        setComments(data.data);
      } else {
        console.error("コメントの取得に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleLike = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!unit) return;

    try {
      const method = unit.isLiked ? "DELETE" : "POST";
      console.log(`Current unit state:`, unit); // デバッグ用
      console.log(`Sending ${method} request to /api/units/${unit.id}/like`);

      const response = await fetch(`/api/units/${unit.id}/like`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const updatedUnit = await response.json();
        console.log("Response from like API:", updatedUnit); // デバッグ用
        setUnit((prevUnit) =>
          prevUnit
            ? {
                ...prevUnit,
                isLiked: !prevUnit.isLiked,
                _count: {
                  ...prevUnit._count,
                  unitLikes: prevUnit.isLiked
                    ? prevUnit._count.unitLikes - 1
                    : prevUnit._count.unitLikes + 1,
                },
              }
            : null
        );
      } else {
        const data = await response.json();
        console.error("いいねの処理に失敗しました:", data.error);
        alert(data.error || "いいねの処理に失敗しました");
      }
    } catch (error) {
      console.error("いいねの処理に失敗しました:", error);
      alert("いいねの処理に失敗しました");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    try {
      const response = await fetch(`/api/units/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments();
        fetchUnit();
      } else {
        const data = await response.json();
        console.error("コメントの投稿に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("このユニットを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
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

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!unit) {
    return <div>ユニットが見つかりません</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{unit.title}</h1>
            <Badge variant="outline" className="mb-4">
              {unit.status === "PLANNED" && "計画中"}
              {unit.status === "IN_PROGRESS" && "進行中"}
              {unit.status === "COMPLETED" && "完了"}
            </Badge>
          </div>
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

          {unit.tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">タグ</h2>
              <div className="flex flex-wrap gap-2">
                {unit.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleLike}
          >
            <Heart
              className={`h-4 w-4 ${
                unit.isLiked ? "fill-current text-red-500" : ""
              }`}
            />
            <span>{unit._count.unitLikes}</span>
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{unit._count.comments}</span>
          </div>
        </div>
      </Card>

      {/* コメントセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">コメント</h2>
        <form onSubmit={handleComment} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            className="mb-2"
          />
          <Button type="submit" disabled={!newComment.trim()}>
            コメントを投稿
          </Button>
        </form>

        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-4">
                {comment.user.image && (
                  <img
                    src={comment.user.image}
                    alt={comment.user.name || "ユーザー"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {comment.user.name || "匿名"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.createdAt), "yyyy/MM/dd HH:mm", {
                        locale: ja,
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.comment}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
