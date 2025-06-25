"use client";

import { useComments } from "@/hooks/useComments";
import { useUnit } from "@/hooks/useUnit";
import { useUnitLike } from "@/hooks/useUnitLike";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CommentsSection } from "./CommentsSection";
import { LogsSection } from "./LogsSection";
import { Sidebar } from "./Sidebar";
import { UnitContent } from "./UnitContent";
import { UnitHeader } from "./UnitHeader";

interface UnitDetailProps {
  id: string;
  session: Session | null;
}

export default function UnitDetail({ id, session }: UnitDetailProps) {
  const router = useRouter();
  const { session: supabaseSession } = useAuthStore();
  const sessionData: Session | null = session || supabaseSession;

  console.log("UnitDetail session state:", {
    serverSession: session,
    supabaseSession,
    hasServerSession: !!session,
    hasSupabaseSession: !!supabaseSession,
  });

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [deletingLogIds, setDeletingLogIds] = useState<number[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const {
    unit,
    isLoading,
    error,
    mutate: mutateUnit,
  } = useUnit({ unitId: id });

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

  const { handleLike: handleUnitLike } = useUnitLike({}, sessionData);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("URLをコピーしました");
    } catch (error) {
      toast.error("URLのコピーに失敗しました");
    }
  }, [currentUrl]);

  const handleDelete = useCallback(async () => {
    if (!confirm("このユニットを削除してもよろしいですか？")) return;

    try {
      const headers: Record<string, string> = {};
      if (sessionData)
        headers["Authorization"] = `Bearer ${sessionData.access_token}`;
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
        headers,
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
  }, [id, sessionData, router]);

  const scrollToComments = useCallback(() => {
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  const handleAddAIComment = useCallback(
    async (comment: string) => {
      if (!sessionData) return;

      try {
        // 楽観的更新
        const optimisticComment = {
          id: Date.now(),
          comment: comment,
          createdAt: new Date().toISOString(),
          user: {
            id: "ai-assistant",
            name: "AIアシスタント",
            image: "/images/ai-assistant.png",
          },
        };

        await optimisticUpdate("create", optimisticComment);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (sessionData.access_token)
          headers["Authorization"] = `Bearer ${sessionData.access_token}`;
        const response = await fetch(`/api/units/${id}/comments`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: comment,
            isAI: true,
          }),
        });

        if (!response.ok) {
          mutateComments();
          const data = await response.json();
          throw new Error(data.error || "コメントの追加に失敗しました");
        }
      } catch (error) {
        console.error("Error adding AI comment:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "コメントの追加に失敗しました"
        );
        mutateComments();
      }
    },
    [id, sessionData, optimisticUpdate, mutateComments]
  );

  const handleCreateComment = useCallback(
    async (comment: string) => {
      if (!sessionData) return;

      try {
        // 楽観的更新
        const optimisticComment = {
          id: Date.now(),
          comment,
          createdAt: new Date().toISOString(),
          user: {
            id: sessionData.user.id,
            name:
              sessionData.user.user_metadata?.name ??
              sessionData.user.user_metadata?.full_name ??
              "",
            image:
              sessionData.user.user_metadata?.avatar_url ??
              sessionData.user.user_metadata?.picture ??
              "",
          },
        };

        await optimisticUpdate("create", optimisticComment);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (sessionData.access_token)
          headers["Authorization"] = `Bearer ${sessionData.access_token}`;
        const response = await fetch(`/api/units/${id}/comments`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: comment,
          }),
        });

        if (!response.ok) {
          mutateComments();
          const errorData = await response.json();

          // Zodバリデーションエラーの場合、詳細なエラーメッセージを表示
          if (errorData.details && Array.isArray(errorData.details)) {
            const errorMessages = errorData.details
              .map((detail: any) => detail.message)
              .join("\n");
            throw new Error(`入力内容に問題があります:\n${errorMessages}`);
          } else {
            throw new Error(errorData.error || "コメントの作成に失敗しました");
          }
        }

        toast.success("コメントを作成しました");
      } catch (error) {
        console.error("Error creating comment:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "コメントの作成に失敗しました"
        );
        mutateComments();
      }
    },
    [id, sessionData, optimisticUpdate, mutateComments]
  );

  const handleUpdateComment = useCallback(
    async (commentId: number, content: string) => {
      try {
        await optimisticUpdate("update", { comment: content }, commentId);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (sessionData)
          headers["Authorization"] = `Bearer ${sessionData.access_token}`;
        const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            content: content,
          }),
        });

        if (!response.ok) {
          mutateComments();
          const errorData = await response.json();

          // Zodバリデーションエラーの場合、詳細なエラーメッセージを表示
          if (errorData.details && Array.isArray(errorData.details)) {
            const errorMessages = errorData.details
              .map((detail: any) => detail.message)
              .join("\n");
            throw new Error(`入力内容に問題があります:\n${errorMessages}`);
          } else {
            throw new Error(errorData.error || "コメントの更新に失敗しました");
          }
        }

        toast.success("コメントを更新しました");
      } catch (error) {
        console.error("Error updating comment:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "コメントの更新に失敗しました"
        );
        mutateComments();
      }
    },
    [id, sessionData, optimisticUpdate, mutateComments]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      if (!confirm("このコメントを削除してもよろしいですか？")) return;
      if (isDeletingComment) return;

      setIsDeletingComment(true);
      try {
        await optimisticUpdate("delete", undefined, commentId);

        const headers: Record<string, string> = {};
        if (sessionData)
          headers["Authorization"] = `Bearer ${sessionData.access_token}`;
        const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
          method: "DELETE",
          headers,
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
          error instanceof Error
            ? error.message
            : "コメントの削除に失敗しました"
        );
        mutateComments();
      } finally {
        setIsDeletingComment(false);
      }
    },
    [id, sessionData, isDeletingComment, optimisticUpdate, mutateComments]
  );

  const handleLike = useCallback(async () => {
    if (!unit) return;

    // 楽観的更新
    const previousData = { data: unit };
    await mutateUnit(
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

    // 共通フックを使用
    await handleUnitLike(parseInt(id), unit.isLiked, mutateUnit);
  }, [unit, mutateUnit, handleUnitLike, id]);

  if (error) {
    return <div>エラーが発生しました</div>;
  }

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (!unit) {
    return <div>ユニットが見つかりません</div>;
  }

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
          scrollToComments={scrollToComments}
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
      </main>
    </div>
  );
}
