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
import { Unit } from "@/types";
import { translateUnitStatus } from "@/utils/i18n";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UnitHeaderProps {
  unit: Unit;
  session: Session | null;
  onMutate: () => void;
  handleLike: () => void;
}

export function UnitHeader({
  unit,
  session,
  onMutate,
  handleLike,
}: UnitHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

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

      toast.success(data.message || "ユニットを削除しました");
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
    <Card className="p-6 bg-card">
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
                  <time dateTime={unit.startDate} className="font-medium">
                    {format(new Date(unit.startDate), "yyyy/MM/dd", {
                      locale: ja,
                    })}
                  </time>
                </div>
              )}
              {unit.endDate && (
                <div className="inline-flex items-center gap-2 bg-muted/20 px-2.5 py-1 rounded-md text-sm">
                  <span className="text-xs text-muted-foreground">終了</span>
                  <time dateTime={unit.endDate} className="font-medium">
                    {format(new Date(unit.endDate), "yyyy/MM/dd", {
                      locale: ja,
                    })}
                  </time>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                        router.push(`/units/${unit.id}/edit`);
                      }}
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

        {unit.unitTags && unit.unitTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unit.unitTags.map((unitTag) => (
              <Badge
                key={unitTag.tag.id}
                variant="secondary"
                className="px-2.5 py-0.5 text-sm bg-secondary/20 hover:bg-secondary/30 border-none transition-colors duration-200"
              >
                {unitTag.tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
