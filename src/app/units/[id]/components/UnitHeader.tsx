"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UnitDTO } from "@/types/unit";
import { translateUnitStatus } from "@/utils/i18n";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Copy,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EditUnitModal } from "./EditUnitModa";

interface UnitHeaderProps {
  unit: UnitDTO;
  session: Session | null;
  onMutate: () => void;
  handleLike: () => void;
  scrollToComments: () => void;
}

export function UnitHeader({
  unit,
  session,
  onMutate,
  handleLike,
  scrollToComments,
}: UnitHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuRef = menuRefs.current[openMenuId];
        const buttonRef = buttonRefs.current[openMenuId];

        if (
          menuRef &&
          buttonRef &&
          !menuRef.contains(event.target as Node) &&
          !buttonRef.contains(event.target as Node)
        ) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleDelete = async () => {
    if (!confirm("このユニットを削除してもよろしいですか？")) return;
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ユニットの削除に失敗しました");
      }

      toast.success("ユニットを削除しました");
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/units");
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "ユニットの削除中にエラーが発生しました"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-6 bg-card relative">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold truncate text-card-foreground">
                {unit.title}
              </h1>
              <div className="flex-shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "inline-flex px-2.5 py-0.5 text-sm font-medium transition-colors whitespace-nowrap",
                    unit.status === "COMPLETED" &&
                      "bg-primary/10 text-primary border-primary/20",
                    unit.status === "IN_PROGRESS" &&
                      "bg-secondary/20 text-secondary-foreground border-secondary/30",
                    unit.status === "PLANNED" &&
                      "bg-muted text-muted-foreground border-muted/50"
                  )}
                >
                  {translateUnitStatus(unit.status)}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {unit.startDate && (
                <div className="inline-flex items-center gap-2 bg-muted/20 px-2.5 py-1 rounded-md text-sm">
                  <span className="text-xs text-muted-foreground">開始</span>
                  <time
                    dateTime={
                      typeof unit.startDate === "string"
                        ? unit.startDate
                        : unit.startDate
                          ? new Date(unit.startDate).toISOString()
                          : ""
                    }
                    className="font-medium"
                  >
                    {format(
                      typeof unit.startDate === "string"
                        ? new Date(unit.startDate)
                        : (unit.startDate ?? new Date()),
                      "yyyy/MM/dd",
                      { locale: ja }
                    )}
                  </time>
                </div>
              )}
              {unit.endDate && (
                <div className="inline-flex items-center gap-2 bg-muted/20 px-2.5 py-1 rounded-md text-sm">
                  <span className="text-xs text-muted-foreground">終了</span>
                  <time
                    dateTime={
                      typeof unit.endDate === "string"
                        ? unit.endDate
                        : unit.endDate
                          ? new Date(unit.endDate).toISOString()
                          : ""
                    }
                    className="font-medium"
                  >
                    {format(
                      typeof unit.endDate === "string"
                        ? new Date(unit.endDate)
                        : (unit.endDate ?? new Date()),
                      "yyyy/MM/dd",
                      { locale: ja }
                    )}
                  </time>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-muted/30"
                      ref={(el) => {
                        if (el) {
                          buttonRefs.current[-1] = el;
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === -1 ? null : -1);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>共有</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div
                ref={(el) => {
                  if (el) {
                    menuRefs.current[-1] = el;
                  }
                }}
                className={cn(
                  "absolute right-0 top-full mt-2 bg-card rounded-lg shadow-lg z-[100] border border-border/50 transition-all duration-200 ease-in-out min-w-[200px]",
                  openMenuId === -1
                    ? "opacity-100 transform translate-y-0 pointer-events-auto"
                    : "opacity-0 transform -translate-y-2 pointer-events-none"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3">
                  <p className="text-xs text-muted-foreground mb-2">共有</p>
                  <div className="flex gap-2 mb-3">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        currentUrl
                      )}&text=${encodeURIComponent(
                        unit.title + " | Learning Journal"
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-black hover:bg-gray-900 text-white transition-colors duration-200"
                      title="Xでシェア"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        currentUrl
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-700 hover:bg-blue-800 text-white transition-colors duration-200"
                      title="Facebookでシェア"
                    >
                      <svg
                        width="14"
                        height="14"
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
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-[#00B900] hover:bg-[#00a000] text-white transition-colors duration-200"
                      title="LINEでシェア"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19.365 9.863c.349 0 .63.285.631.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"></path>
                      </svg>
                    </a>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(currentUrl);
                      toast.success("URLをコピーしました");
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-foreground hover:bg-accent rounded-md flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    URLをコピー
                  </button>
                </div>
              </div>
            </div>

            {session?.user?.id === unit.userId && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted/30"
                  ref={(el) => {
                    if (el) {
                      buttonRefs.current[unit.id] = el;
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === unit.id ? null : unit.id);
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <div
                  ref={(el) => {
                    if (el) {
                      menuRefs.current[unit.id] = el;
                    }
                  }}
                  className={cn(
                    "absolute right-0 top-full mt-2 bg-card rounded-lg shadow-lg z-10 border border-border/50 transition-all duration-200 ease-in-out min-w-[160px]",
                    openMenuId === unit.id
                      ? "opacity-100 transform translate-y-0"
                      : "opacity-0 transform -translate-y-2 pointer-events-none"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-foreground hover:bg-muted/30 flex items-center gap-2 transition-colors duration-200"
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setOpenMenuId(null);
                      }}
                      disabled={isDeleting}
                    >
                      <Pencil className="h-4 w-4" />
                      編集
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors duration-200"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "削除中..." : "削除"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {unit.tags && unit.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unit.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="px-2.5 py-0.5 text-sm bg-secondary/20 hover:bg-secondary/30 border-none transition-colors duration-200"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="lg:hidden absolute right-4 bottom-4 flex gap-3 z-10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 rounded-full px-2 py-1 shadow-md bg-background border border-border ${unit.isLiked ? "text-pink-500" : "text-gray-500"}`}
          title="いいね"
        >
          <Heart className={`h-4 w-4 ${unit.isLiked ? "fill-current" : ""}`} />
          <span className="text-sm">{unit._count?.unitLikes ?? 0}</span>
        </button>
        <button
          onClick={scrollToComments}
          className="flex items-center gap-1 rounded-full px-2 py-1 shadow-md bg-background border border-border text-gray-500"
          title="コメント"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">{unit._count?.comments ?? 0}</span>
        </button>
      </div>
      <EditUnitModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        unit={unit}
        onSave={onMutate}
      />
    </Card>
  );
}
