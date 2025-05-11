"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMenu } from "@/contexts/MenuContext";
import { LogDTO } from "@/types/log";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ExternalLink,
  File,
  LinkIcon,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface LogCardProps {
  log: LogDTO;
  unitId: string;
  session: Session | null;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function LogCard({
  log,
  unitId,
  session,
  onEdit,
  onDelete,
}: Omit<LogCardProps, "openMenuId" | "setOpenMenuId">) {
  const { openMenuId, setOpenMenuId } = useMenu();
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openMenuId === log.id &&
        menuButtonRef.current &&
        menuContentRef.current &&
        !menuButtonRef.current.contains(event.target as Node) &&
        !menuContentRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".menu-action-button")
      ) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId === log.id) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuId, log.id, setOpenMenuId]);

  const handleDelete = async () => {
    if (!confirm("このログを削除してもよろしいですか？")) return;
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/units/${unitId}/logs/${log.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete();
        setOpenMenuId(null);
        toast.success("ログを削除しました");
      } else {
        const data = await response.json();
        throw new Error(data.error || "ログの削除に失敗しました");
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error(
        error instanceof Error ? error.message : "ログの削除に失敗しました"
      );
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">{log.title}</h3>
          <p className="text-xs sm:text-sm text-gray-500">
            {format(new Date(log.logDate), "yyyy/MM/dd", { locale: ja })}
          </p>
        </div>

        {session?.user?.id === String(log.userId) && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 menu-action-button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === log.id ? null : log.id);
              }}
              ref={menuButtonRef}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {openMenuId === log.id && (
              <div className="absolute right-0 mt-2 min-w-[120px] rounded-md shadow-lg bg-background ring-1 ring-border z-10 menu-content">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-foreground hover:bg-accent flex items-center gap-2 menu-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setOpenMenuId(null);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                    編集
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-destructive hover:bg-accent flex items-center gap-2 menu-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
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

      {log.note && (
        <div className="mt-2">
          <div
            className={`prose prose-sm max-w-none dark:prose-invert ${
              !expandedContent && log.note.length > 200 ? "line-clamp-[4]" : ""
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {log.note}
            </ReactMarkdown>
          </div>
          {log.note.length > 200 && (
            <button
              onClick={() => setExpandedContent(!expandedContent)}
              className="text-xs text-blue-500 mt-2 hover:underline"
            >
              {expandedContent ? "折りたたむ" : "続きを読む"}
            </button>
          )}
        </div>
      )}

      {log.learningTime && (
        <div className="mt-2 text-sm text-gray-500">
          学習時間: {log.learningTime}分
        </div>
      )}

      {log.effectScore !== undefined && log.effectScore !== null && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-500">効果実感:</span>
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

      {log.tags && log.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {log.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {Array.isArray(log.resources) && log.resources.length > 0 && (
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
                    {resource.description || resource.resourceLink}
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
