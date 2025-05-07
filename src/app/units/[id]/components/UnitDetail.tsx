"use client";

import { Button } from "@/components/ui/button";
import { Unit } from "@/types";
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

export default function UnitDetail({ id, session }: UnitDetailProps) {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [deletingLogIds, setDeletingLogIds] = useState<number[]>([]);

  const {
    data: { data: unit } = {
      data: { _count: { logs: 0, comments: 0, unitLikes: 0 } } as Unit,
    },
    error,
    mutate: mutateUnit,
  } = useSWR<{ data: Unit }>(`/api/units/${id}`, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
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
          userId={unit.userId}
          session={sessionData}
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
