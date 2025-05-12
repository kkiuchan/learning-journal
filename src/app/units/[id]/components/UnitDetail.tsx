"use client";

import { Button } from "@/components/ui/button";
import { useComments } from "@/hooks/useComments";
import { UnitDTO } from "@/types/unit";
import { Heart, Link, MessageCircle } from "lucide-react";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CommentsSection } from "./CommentsSection";
import { LogsSection } from "./LogsSection";
import { Sidebar } from "./Sidebar";
import { UnitContent } from "./UnitContent";
import { UnitHeader } from "./UnitHeader";

interface UnitDetailProps {
  id: string;
  session: Session | null;
}

// const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UnitDetail({ id, session }: UnitDetailProps) {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [deletingLogIds, setDeletingLogIds] = useState<number[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const {
    data: unitData,
    error,
    mutate: mutateUnit,
  } = useSWR<{ data: UnitDTO }>(`/api/units/${id}`);

  const unit = unitData?.data;

  const {
    comments,
    pagination,
    isLoading: isLoadingComments,
    mutate: mutateComments,
    optimisticUpdate,
  } = useComments({
    unitId: id,
    page: commentPage,
    limit: 10,
  });

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  if (error) {
    return <div>エラーが発生しました</div>;
  }

  if (!unit) {
    return <div>読み込み中...</div>;
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("URLをコピーしました");
    } catch (error) {
      toast.error("URLのコピーに失敗しました");
    }
  };

  const handleLike = async () => {
    if (!sessionData?.user) {
      toast.error(
        <div className="flex flex-col gap-2">
          <p>いいねするにはログインが必要です</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login" className="text-sm">
              ログインする
            </Link>
          </Button>
        </div>
      );
      return;
    }

    const isCurrentlyLiked = unit.isLiked;
    const previousData = { data: unit };

    // 楽観的更新
    await mutateUnit(
      {
        data: {
          ...unit,
          isLiked: !isCurrentlyLiked,
          _count: {
            ...unit._count,
            unitLikes: isCurrentlyLiked
              ? unit._count.unitLikes - 1
              : unit._count.unitLikes + 1,
          },
        },
      },
      false
    );

    try {
      const response = await fetch(`/api/units/${id}/like`, {
        method: isCurrentlyLiked ? "DELETE" : "POST",
      });

      if (!response.ok) {
        // エラーの場合、前の状態に戻す
        await mutateUnit(previousData, false);
        const data = await response.json();
        throw new Error(data.error || "いいねの更新に失敗しました");
      }

      // APIレスポンス後に再検証を行う
      await mutateUnit();

      // 成功メッセージを表示
      toast.success(
        isCurrentlyLiked ? "いいねを解除しました" : "いいねしました"
      );
    } catch (error) {
      // エラーの場合、前の状態に戻す
      await mutateUnit(previousData, false);
      console.error("いいねの更新中にエラーが発生しました:", error);
      toast.error(
        error instanceof Error ? error.message : "いいねの更新に失敗しました"
      );
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
        toast.success("ユニットを削除しました");
      } else {
        const data = await response.json();
        throw new Error(data.error || "ユニットの削除に失敗しました");
      }
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error(
        error instanceof Error ? error.message : "ユニットの削除に失敗しました"
      );
    }
  };

  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAddAIComment = () => {
    // Implementation of handleAddAIComment function
  };

  const handleCreateComment = async (comment: string) => {
    if (!sessionData?.user) return;

    try {
      // 楽観的更新
      const optimisticComment = {
        id: Date.now(),
        comment,
        createdAt: new Date().toISOString(),
        user: {
          id: sessionData.user.id,
          name: sessionData.user.name || null,
          image: sessionData.user.image || null,
        },
      };

      await optimisticUpdate("create", optimisticComment);

      const response = await fetch(`/api/units/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment,
        }),
      });

      if (!response.ok) {
        mutateComments();
        const data = await response.json();
        throw new Error(data.error || "コメントの作成に失敗しました");
      }

      toast.success("コメントを作成しました");
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの作成に失敗しました"
      );
      mutateComments();
    }
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      await optimisticUpdate("update", { comment: content }, commentId);

      const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: content,
        }),
      });

      if (!response.ok) {
        mutateComments();
        const data = await response.json();
        throw new Error(data.error || "コメントの更新に失敗しました");
      }

      toast.success("コメントを更新しました");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの更新に失敗しました"
      );
      mutateComments();
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("このコメントを削除してもよろしいですか？")) return;
    if (isDeletingComment) return;

    setIsDeletingComment(true);
    try {
      await optimisticUpdate("delete", undefined, commentId);

      const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        mutateComments();
        const data = await response.json();
        throw new Error(data.error || "コメントの削除に失敗しました");
      }

      toast.success("コメントを削除しました");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの削除に失敗しました"
      );
      mutateComments();
    } finally {
      setIsDeletingComment(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Sidebar
        unit={unit}
        session={sessionData}
        id={id}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        handleCopyUrl={handleCopyUrl}
        copied={copied}
        handleLike={handleLike}
        handleDelete={handleDelete}
        menuRefs={menuRefs}
        currentUrl={currentUrl}
        commentCount={unit._count?.comments || 0}
        onCommentClick={scrollToComments}
        onMutate={mutateUnit}
        className="fixed left-[clamp(-50px,calc(50%-640px-64px),200px)] top-[calc(50%+100px)] -translate-y-1/2 hidden lg:flex"
      />

      <main className="max-w-6xl w-full mx-auto p-2 lg:pl-[clamp(80px,0px,10%)]">
        <UnitHeader
          unit={unit}
          session={sessionData}
          onMutate={mutateUnit}
          handleLike={handleLike}
        />
        <UnitContent
          unit={unit}
          session={sessionData}
          onMutate={mutateUnit}
          id={id}
        />

        <LogsSection
          unitId={id}
          userId={unit.userId}
          session={sessionData}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onAIAdvice={handleAddAIComment}
        />

        <CommentsSection
          unitId={id}
          userId={unit?.userId || ""}
          session={sessionData}
          comments={comments}
          pagination={pagination || null}
          isLoading={isLoadingComments}
          onPageChange={setCommentPage}
          onCreateComment={handleCreateComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          isDeleting={isDeletingComment}
        />

        <div className="flex flex-wrap items-center justify-end gap-4 mt-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 lg:hidden ${
              unit.isLiked ? "text-pink-500" : "text-gray-500"
            }`}
            title="いいね"
          >
            <Heart
              className={`h-4 w-4 ${unit.isLiked ? "fill-current" : ""}`}
            />
            <span className="text-sm">{unit._count?.unitLikes ?? 0}</span>
          </button>
          <button
            onClick={scrollToComments}
            className="flex items-center gap-1 text-gray-500 lg:hidden"
            title="コメント"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{unit._count?.comments ?? 0}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
