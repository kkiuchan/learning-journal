"use client";

import { AdviceButton } from "@/components/AdviceButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/useComments";
import { useLogs } from "@/hooks/useLogs";
import { Unit } from "@/types";
import { translateUnitStatus } from "@/utils/i18n";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Copy,
  ExternalLink,
  File,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import useSWR from "swr";
import CreateLogForm from "./components/CreateLogForm";
import EditLogForm from "./components/EditLogForm";
import Sidebar from "./components/Sidebar";
import { TableOfContents } from "./components/TableOfContents";

// 画像URLの検証関数
const isValidImageUrl = (url: string | null): boolean => {
  if (!url) return false;
  const allowedDomains = [
    "lh3.googleusercontent.com",
    "avatars.githubusercontent.com",
    "localhost",
    window.location.hostname,
    "supabase.co",
  ];
  try {
    const urlObj = new URL(url);
    return allowedDomains.some((domain) => urlObj.hostname.includes(domain));
  } catch {
    // 相対パスの場合は許可（プロジェクトディレクトリ内の画像）
    return url.startsWith("/");
  }
};

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
  // Hooksはすべてトップレベルで宣言
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession() as {
    data: Session | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };

  // SWRを使用してユニットを取得
  const {
    data: unitData,
    error: unitError,
    mutate: mutateUnit,
    isLoading,
  } = useSWR<{ data: Unit } | undefined>(`/api/units/${id}`, undefined);

  // SWRを使用してログを取得
  const { logs, isLoading: logsLoading, mutate: mutateLogs } = useLogs(id);

  // SWRを使用してコメントを取得
  const [commentPage, setCommentPage] = useState(1);
  const {
    comments,
    pagination,
    isLoading: commentsLoading,
    mutate: mutateComments,
    optimisticUpdate,
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
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // --- 共有用URLとコピー機能のHooksをトップレベルで宣言 ---
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // メニュー外をクリックしたときにメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuRef = menuRefs.current[openMenuId];
        const shareMenuRef = menuRefs.current[-1];

        // シェアメニューが開いているとき
        if (
          openMenuId === -1 &&
          shareMenuRef &&
          !shareMenuRef.contains(event.target as Node)
        ) {
          setOpenMenuId(null);
        }
        // その他のメニューが開いているとき
        else if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenuId]);

  // 状態の追加
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);
  const [deletingLogIds, setDeletingLogIds] = useState<number[]>([]);
  const [deletingCommentIds, setDeletingCommentIds] = useState<number[]>([]);

  // ローディング中の表示
  if (status === "loading") {
    return <Loading text="認証情報を確認中..." />;
  }

  // 未認証の場合はリダイレクト
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  // ユニットのローディング中の表示
  if (isLoading || !unitData) {
    return <Loading />;
  }

  // エラーの表示
  if (unitError) {
    return (
      <div className="rounded-lg bg-destructive/15 p-4 text-destructive">
        ユニットの読み込みに失敗しました
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("このユニットを削除してもよろしいですか？")) return;
    if (isDeletingUnit) return;

    setIsDeletingUnit(true);
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
        alert("ユニットの削除に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      alert("エラーが発生しました");
    } finally {
      setIsDeletingUnit(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    try {
      // 楽観的更新
      const optimisticComment = {
        id: Date.now(),
        comment: newComment,
        createdAt: new Date().toISOString(),
        user: {
          id: session.user.id,
          name: session.user.name || null,
          image: session.user.image || null,
          topImage: null,
          selfIntroduction: null,
          age: null,
          ageVisible: false,
          skills: [],
          interests: [],
          email: "",
          hashedPassword: "",
          primaryAuthMethod: "credentials",
        },
      };

      await optimisticUpdate("create", optimisticComment);
      setNewComment("");

      const response = await fetch(`/api/units/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: newComment,
        }),
      });

      if (!response.ok) {
        // エラーが発生した場合は再取得
        mutateComments();
        const data = await response.json();
        console.error("コメントの作成に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      mutateComments();
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("このコメントを削除してもよろしいですか？")) return;
    if (deletingCommentIds.includes(commentId)) return;

    setDeletingCommentIds((prev) => [...prev, commentId]);
    try {
      // 楽観的更新
      await optimisticUpdate("delete", undefined, commentId);

      const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // エラーが発生した場合は再取得
        mutateComments();
        const data = await response.json();
        console.error("コメントの削除に失敗しました:", data.error);
        alert("コメントの削除に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      mutateComments();
      alert("エラーが発生しました");
    } finally {
      setDeletingCommentIds((prev) => prev.filter((id) => id !== commentId));
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingCommentContent.trim()) return;

    try {
      // 楽観的更新
      await optimisticUpdate(
        "update",
        { comment: editingCommentContent },
        commentId
      );
      setEditingCommentId(null);
      setEditingCommentContent("");

      const response = await fetch(`/api/units/${id}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: editingCommentContent,
        }),
      });

      if (!response.ok) {
        // エラーが発生した場合は再取得
        mutateComments();
        const data = await response.json();
        console.error("コメントの更新に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      mutateComments();
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

  const handleAddAIComment = async (comment: string) => {
    if (!session?.user) return;

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
          topImage: null,
          selfIntroduction: "学習をサポートするAIアシスタントです",
          age: null,
          ageVisible: false,
          skills: [],
          interests: [],
          email: "",
          hashedPassword: "",
          primaryAuthMethod: "credentials",
        },
      };

      await optimisticUpdate("create", optimisticComment);

      const response = await fetch(`/api/units/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: comment,
          isAI: true,
        }),
      });

      if (!response.ok) {
        // エラーが発生した場合は再取得
        mutateComments();
        toast.error("コメントの追加に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      mutateComments();
      toast.error("コメントの追加に失敗しました");
    }
  };

  const toggleCommentExpansion = (commentId: number) => {
    setExpandedComments((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId]
    );
  };

  const toggleLogExpansion = (logId: number) => {
    setExpandedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
  };

  const handleCommentClick = () => {
    const commentSection = document.getElementById("comments-section");
    if (commentSection) {
      commentSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogDelete = async (logId: number) => {
    if (!confirm("このログを削除してもよろしいですか？")) return;
    if (deletingLogIds.includes(logId)) return;

    setDeletingLogIds((prev) => [...prev, logId]);
    try {
      const response = await fetch(`/api/units/${id}/logs/${logId}`, {
        method: "DELETE",
        next: {
          tags: [
            `unit-${id}`,
            "unit",
            "unit-list",
            "log",
            "log-list",
            `log-${logId}`,
          ],
        },
      });

      if (response.ok) {
        await mutateLogs(
          (current) => {
            if (!current) return current;
            return {
              ...current,
              data: current.data.filter((l) => l.id !== logId),
            };
          },
          {
            revalidate: true,
            populateCache: true,
          }
        );
        setOpenMenuId(null);
      } else {
        const data = await response.json();
        console.error("ログの削除に失敗しました:", data.error);
        alert("ログの削除に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      alert("エラーが発生しました");
    } finally {
      setDeletingLogIds((prev) => prev.filter((id) => id !== logId));
    }
  };

  const unit = unitData.data;

  return (
    <div className="relative min-h-screen">
      <Sidebar
        unit={unit}
        session={session}
        id={id}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        handleCopyUrl={handleCopyUrl}
        copied={copied}
        handleLike={handleLike}
        handleDelete={handleDelete}
        menuRefs={menuRefs}
        currentUrl={currentUrl}
        commentCount={unit._count.comments}
        onCommentClick={handleCommentClick}
        className="fixed left-[clamp(-50px,calc(50%-640px-64px),200px)] top-[calc(50%+100px)] -translate-y-1/2 hidden lg:flex"
      />
      <main className="max-w-6xl w-full mx-auto p-2 lg:pl-[clamp(80px,0px,10%)]">
        <Card className="p-3 sm:p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold">{unit.title}</h1>
                <Badge
                  variant={
                    unit.status === "COMPLETED"
                      ? "default"
                      : unit.status === "IN_PROGRESS"
                      ? "secondary"
                      : "outline"
                  }
                  className={`
                    text-[10px] sm:text-xs
                    px-1 py-0
                    rounded-[3px]
                    ${
                      unit.status === "COMPLETED"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : unit.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100"
                    }
                    whitespace-nowrap
                    min-w-0
                    h-5
                    leading-none
                  `}
                >
                  {translateUnitStatus(unit.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {unit.user.image && (
                    <img
                      src={unit.user.image}
                      alt={unit.user.name || "ユーザー"}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>{unit.user.name || "ユーザー"}</span>
                </div>
                <span>•</span>
                <span>
                  {format(new Date(unit.createdAt), "yyyy/MM/dd", {
                    locale: ja,
                  })}
                </span>
              </div>
            </div>
            {/* 小画面用のメニューボタン */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === -1 ? null : -1);
                  }}
                  title="シェア"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <div
                  ref={(el) => {
                    if (el) {
                      menuRefs.current[-1] = el;
                    }
                  }}
                  className={`absolute right-0 top-full mt-1 bg-background rounded-md shadow-lg z-10 border transition-all duration-200 ease-in-out min-w-[200px] ${
                    openMenuId === -1
                      ? "opacity-100 transform translate-y-0"
                      : "opacity-0 transform -translate-y-2 pointer-events-none"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <div className="px-2 py-2">
                      <p className="text-xs text-muted-foreground mb-2">共有</p>
                      <div className="flex gap-2">
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                            currentUrl
                          )}&text=${encodeURIComponent(
                            unit.title + " | Learning Journal"
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                          title="Twitterでシェア"
                        >
                          <svg
                            width="15"
                            height="15"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.932 0 .386.045.763.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 1.997 1.397 3.872 3.448 4.29a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z" />
                          </svg>
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                            currentUrl
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-700 hover:bg-blue-800 text-white"
                          title="Facebookでシェア"
                        >
                          <svg
                            width="12"
                            height="12"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" />
                          </svg>
                        </a>
                        <a
                          href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                            currentUrl
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white"
                          title="LINEでシェア"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 448 512"
                            fill="currentColor"
                          >
                            <path d="M272.1 204.2v71.1c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.1 0-2.1-.6-2.6-1.3l-32.6-44v42.2c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.8 0-3.2-1.4-3.2-3.2v-71.1c0-1.8 1.4-3.2 3.2-3.2h11.4c1.1 0 2.1.6 2.6 1.3l32.6 44v-42.2c0-1.8 1.4-3.2 3.2-3.2h11.4c1.8-.1 3.2 1.4 3.2 3.2zm-82-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 1.8 1.4 3.2 3.2 3.2h11.4c1.8 0 3.2-1.4 3.2-3.2v-71.1c0-1.7-1.4-3.2-3.2-3.2zm-27.5 59.6h-31.1v-56.4c0-1.8-1.4-3.2-3.2-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 .9.3 1.6.9 2.2.6.5 1.3.9 2.2.9h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.7-1.4-3.2-3.1-3.2zM332.1 201h-45.7c-1.7 0-3.2 1.4-3.2 3.2v71.1c0 1.7 1.4 3.2 3.2 3.2h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2V234c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2v-11.4c-.1-1.7-1.5-3.2-3.2-3.2zM448 113.7V399c-.1 44.8-36.8 81.1-81.7 81H81c-44.8-.1-81.1-36.9-81-81.7V113c.1-44.8 36.9-81.1 81.7-81H367c44.8.1 81.1 36.8 81 81.7zm-61.6 122.6c0-73-73.2-132.4-163.1-132.4-89.9 0-163.1 59.4-163.1 132.4 0 65.4 58 120.2 136.4 130.6 19.1 4.1 16.9 11.1 12.6 36.8-.7 4.1-3.3 16.1 14.1 8.8 17.4-7.3 93.9-55.3 128.2-94.7 23.6-26 34.9-52.3 34.9-81.5z" />
                          </svg>
                        </a>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigator.clipboard.writeText(currentUrl);
                          toast.success("URLをコピーしました");
                          setOpenMenuId(null);
                        }}
                        className="w-full mt-2 text-left px-2 py-1.5 text-foreground hover:bg-accent rounded flex items-center gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        URLをコピー
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {session?.user?.id === unit.userId && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(
                        openMenuId === parseInt(id) ? null : parseInt(id)
                      );
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <div
                    ref={(el) => {
                      if (el) {
                        menuRefs.current[parseInt(id)] = el;
                      }
                    }}
                    className={`absolute right-0 top-full mt-1 bg-background rounded-md shadow-lg z-10 border transition-all duration-200 ease-in-out min-w-[160px] ${
                      openMenuId === parseInt(id)
                        ? "opacity-100 transform translate-y-0"
                        : "opacity-0 transform -translate-y-2 pointer-events-none"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <Link href={`/units/${id}/edit`}>
                        <button
                          className="w-full text-left px-4 py-2 text-foreground hover:bg-accent flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                          編集
                        </button>
                      </Link>
                      <button
                        className="w-full text-left px-4 py-2 text-destructive hover:bg-accent flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                          setOpenMenuId(null);
                        }}
                        disabled={isDeletingUnit}
                      >
                        <Trash2 className="h-3 w-3" />
                        {isDeletingUnit ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {unit.learningGoal && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2">
                  学習目標
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {unit.learningGoal}
                </p>
              </div>
            )}

            {unit.preLearningState && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2">
                  事前の学習状態
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {unit.preLearningState}
                </p>
              </div>
            )}

            {unit.reflection && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2">
                  振り返り
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {unit.reflection}
                </p>
              </div>
            )}

            {unit.nextAction && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2">
                  次のアクション
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {unit.nextAction}
                </p>
              </div>
            )}

            {(unit.startDate || unit.endDate) && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2">
                  学習期間
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
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

            <div className="flex flex-wrap items-center justify-end gap-4 mt-4">
              {/* いいねボタン（小画面のみ） */}
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
                <span className="text-sm">{unit._count.unitLikes}</span>
              </button>
              {/* コメントボタン（小画面のみ） */}
              <button
                onClick={handleCommentClick}
                className="flex items-center gap-1 text-gray-500 lg:hidden"
                title="コメント"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{unit._count.comments}</span>
              </button>
              {/* AIアドバイスボタン */}
              {session?.user?.id === unit.userId && (
                <AdviceButton
                  unitId={id}
                  onAddComment={handleAddAIComment}
                  userId={unit.userId}
                />
              )}
              {/* 右寄せのメニューボタン */}
            </div>
          </div>
        </Card>
        {/* 学習ログ */}
        <div className="mt-4 sm:mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">学習ログ</h2>
            <div className="flex gap-2">
              {session?.user?.id === unit.userId && (
                <Button onClick={() => setIsCreatingLog(true)}>
                  ログを追加
                </Button>
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
                <Card
                  key={log.id}
                  id={`log-${log.id}`}
                  className="p-4 scroll-mt-24"
                >
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
                          <h3 className="text-base sm:text-lg font-semibold">
                            {log.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {format(new Date(log.logDate), "yyyy/MM/dd", {
                              locale: ja,
                            })}
                          </p>
                        </div>

                        {session?.user?.id === String(log.userId) && (
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === log.id ? null : log.id
                                )
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>

                            {openMenuId === log.id && (
                              <div className="absolute right-0 mt-2 min-w-[120px] rounded-md shadow-lg bg-background ring-1 ring-border z-10">
                                <div className="py-1">
                                  <button
                                    className="w-full text-left px-4 py-2 text-foreground hover:bg-accent flex items-center gap-2"
                                    onClick={(e) => {
                                      // e.preventDefault();
                                      e.stopPropagation();
                                      setEditingLogId(log.id);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                    編集
                                  </button>
                                  <button
                                    className="w-full text-left px-4 py-2 text-destructive hover:bg-accent flex items-center gap-2"
                                    onClick={async () => {
                                      handleLogDelete(log.id);
                                    }}
                                    disabled={deletingLogIds.includes(log.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    {deletingLogIds.includes(log.id)
                                      ? "削除中..."
                                      : "削除"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {log.note && (
                        <div className="mt-2">
                          <div
                            className={`prose prose-sm max-w-none dark:prose-invert ${
                              !expandedLogs.includes(log.id) &&
                              log.note.length > 200
                                ? "line-clamp-[4]"
                                : ""
                            }`}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                pre: ({ node, ...props }) => (
                                  <div
                                    className={`${
                                      !expandedLogs.includes(log.id)
                                        ? "max-h-[150px] overflow-y-auto"
                                        : ""
                                    }`}
                                  >
                                    <pre {...props} />
                                  </div>
                                ),
                                code: ({
                                  node,
                                  className,
                                  children,
                                  ...props
                                }: any) => {
                                  const match = /language-(\w+)/.exec(
                                    className || ""
                                  );
                                  const isInline = !match;
                                  return !isInline ? (
                                    <div
                                      className={`${
                                        !expandedLogs.includes(log.id)
                                          ? "max-h-[200px] overflow-y-auto"
                                          : ""
                                      }`}
                                    >
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </div>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {log.note}
                            </ReactMarkdown>
                          </div>
                          {log.note.length > 200 && (
                            <button
                              onClick={() => toggleLogExpansion(log.id)}
                              className="text-xs text-blue-500 mt-2 hover:underline"
                            >
                              {expandedLogs.includes(log.id)
                                ? "折りたたむ"
                                : "続きを読む"}
                            </button>
                          )}
                        </div>
                      )}
                      {log.learningTime && (
                        <div className="mt-2 text-sm text-gray-500">
                          学習時間: {log.learningTime}分
                        </div>
                      )}

                      {log.effectScore !== undefined &&
                        log.effectScore !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              効果実感:
                            </span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (log.effectScore ?? 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                      {log.effectType && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-sm">
                            {getEffectTypeLabel(log.effectType)}
                          </Badge>
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
                            <h4 className="text-xs sm:text-sm font-medium">
                              リソース ({log.resources.length}件)
                            </h4>
                            <div className="space-y-2">
                              {log.resources.map((resource) => (
                                <div
                                  key={resource.id}
                                  className="text-xs sm:text-sm flex items-start gap-2 bg-card p-2 rounded"
                                >
                                  {resource.resourceType === "file" ? (
                                    <File className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 text-blue-500" />
                                  ) : (
                                    <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 text-blue-500" />
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
                                      <ExternalLink className="h-2 w-2 sm:h-3 sm:w-3" />
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
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {comment.user.image &&
                          isValidImageUrl(comment.user.image) && (
                            <img
                              src={comment.user.image}
                              alt={comment.user.name || "ユーザー"}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
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
                      {session?.user?.id &&
                        (session.user.id === comment.user.id ||
                          session.user.id === unit.userId) && (
                          <div
                            className="relative ml-2"
                            ref={(el) => {
                              menuRefs.current[comment.id] = el;
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === comment.id ? null : comment.id
                                )
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            <div
                              className={`absolute right-0 mt-1 bg-background rounded-md shadow-lg z-10 border transition-all duration-200 ease-in-out min-w-[120px] ${
                                openMenuId === comment.id
                                  ? "opacity-100 transform translate-y-0"
                                  : "opacity-0 transform -translate-y-2 pointer-events-none"
                              }`}
                            >
                              <div className="py-1">
                                {session.user.id === comment.user.id && (
                                  <button
                                    className="w-full text-left px-4 py-2 text-foreground hover:bg-accent flex items-center gap-2"
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingCommentContent(comment.comment);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                    編集
                                  </button>
                                )}
                                <button
                                  className="w-full text-left px-4 py-2 text-destructive hover:bg-accent flex items-center gap-2"
                                  onClick={() => {
                                    handleDeleteComment(comment.id);
                                    setOpenMenuId(null);
                                  }}
                                  disabled={deletingCommentIds.includes(
                                    comment.id
                                  )}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {deletingCommentIds.includes(comment.id)
                                    ? "削除中..."
                                    : "削除"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
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

          {/* もっと見るボタン */}
          {pagination && commentPage < pagination.totalPages && (
            <button onClick={handleLoadMoreComments}>もっと見る</button>
          )}
        </div>
      </main>

      {/* 目次コンポーネント */}
      {logs && <TableOfContents logs={logs} />}
    </div>
  );
}

function getEffectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    understanding: "理解が深まった",
    practical: "実際に使えるようになった",
    application: "応用のアイデアが生まれた",
    none: "特になかった",
  };
  return labels[type] || type;
}
