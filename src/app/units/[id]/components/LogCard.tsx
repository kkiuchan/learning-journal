"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { cn } from "@/lib/utils";
import { LogDTO } from "@/types/log";
import { getEffectTypeLabel } from "@/utils/effect";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import "github-markdown-css/github-markdown-dark.css";
import {
  Clipboard,
  ExternalLink,
  File,
  Github,
  LinkIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface LogCardProps {
  log: LogDTO;
  unitId: string;
  session: Session | null;
  onEdit: (log: LogDTO) => void;
  onDeleteLog: (logId: number) => void;
  isDeleting?: boolean;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

// ✅ LogCardを最適化されたメモ化で包む
const LogCard = React.memo(
  function LogCard({
    log,
    unitId,
    session,
    onEdit,
    onDeleteLog,
    isDeleting = false,
    isMenuOpen,
    onMenuToggle,
  }: LogCardProps) {
    const [expandedContent, setExpandedContent] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuContentRef = useRef<HTMLDivElement>(null);

    const DEVELOPER_EMAIL = "bandman.gh.bs.dk.lav@gmail.com";

    const handleCopy = async () => {
      await navigator.clipboard.writeText(log.note);
      toast.success("コピーしました！");
    };

    const handlePushToGithub = async () => {
      if (!session?.user) {
        toast.error("ログインが必要です。");
        return;
      }
      setIsPushing(true);

      const content = `
# ${log.title}

- **学習日**: ${format(new Date(log.logDate), "yyyy/MM/dd")}
- **学習時間**: ${log.learningTime || "記録なし"}分
- **効果実感**: ${log.effectScore !== null ? `${log.effectScore}/5` : "未評価"}
- **効果の種類**: ${log.effectType ? getEffectTypeLabel(log.effectType) : "未分類"}

## 内容

${log.note || "記録なし"}
    `.trim();

      try {
        const response = await fetch("/api/push-to-github", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: log.title,
            content: content,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "GitHubへのプッシュに失敗しました。");
        }

        toast.success("GitHubに学習ログをプッシュしました！", {
          action: {
            label: "ファイルを見る",
            onClick: () => window.open(data.url, "_blank"),
          },
        });
      } catch (error) {
        console.error("Error pushing to GitHub:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "GitHubへのプッシュ中にエラーが発生しました。"
        );
      } finally {
        setIsPushing(false);
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        console.log("🔍 handleClickOutside 実行:", {
          isMenuOpen,
          target: event.target,
          targetElement: event.target as HTMLElement,
          targetClassName: (event.target as HTMLElement)?.className,
          menuButtonContains: menuButtonRef.current?.contains(
            event.target as Node
          ),
          menuContentContains: menuContentRef.current?.contains(
            event.target as Node
          ),
          menuButtonRef: menuButtonRef.current,
          menuContentRef: menuContentRef.current,
        });

        if (
          isMenuOpen &&
          menuButtonRef.current &&
          menuContentRef.current &&
          !menuButtonRef.current.contains(event.target as Node) &&
          !menuContentRef.current.contains(event.target as Node)
        ) {
          console.log("🔄 外側クリック検知でメニューを閉じる");
          onMenuToggle();
        } else {
          console.log("🚫 外側クリック条件に合致せず、メニューを閉じない");
        }
      };

      if (isMenuOpen) {
        // より長い遅延でメニュー内のクリックイベントが完全に処理されるまで待つ
        const timeoutId = setTimeout(() => {
          document.addEventListener("click", handleClickOutside);
        }, 100);

        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener("click", handleClickOutside);
        };
      }
    }, [isMenuOpen, onMenuToggle]);

    // メニュー状態のデバッグ
    useEffect(() => {
      console.log(
        `🎯 LogCard ${log.id} メニュー状態変化: isMenuOpen=${isMenuOpen}`
      );
    }, [isMenuOpen, log.id]);

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
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-colors"
                onClick={handleCopy}
                title="内容をコピー"
              >
                <Clipboard className="h-4 w-4" />
              </button>
              {session?.user?.email === DEVELOPER_EMAIL && (
                <button
                  type="button"
                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-colors disabled:opacity-50"
                  onClick={handlePushToGithub}
                  disabled={isPushing}
                  title={isPushing ? "プッシュ中..." : "GitHubにプッシュ"}
                >
                  {isPushing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="h-4 w-4" />
                  )}
                </button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 menu-action-button"
                onClick={(e) => {
                  console.log(
                    "📋 メニューボタンクリック:",
                    log.id,
                    "現在のisMenuOpen:",
                    isMenuOpen
                  );
                  e.stopPropagation();
                  onMenuToggle();
                }}
                ref={menuButtonRef}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {isMenuOpen && (
                <div
                  ref={menuContentRef}
                  className="absolute right-0 mt-2 min-w-[160px] rounded-md shadow-lg bg-background ring-1 ring-border z-10 menu-content"
                >
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-foreground hover:bg-accent flex items-center gap-2 menu-action-button"
                      onMouseDown={(e) => {
                        console.log(
                          "🖊️ 編集ボタン mousedown:",
                          log.id,
                          e.target
                        );
                        e.stopPropagation();
                        e.preventDefault();
                        onEdit(log);
                        onMenuToggle();
                      }}
                      onClick={(e) => {
                        console.log("🖊️ 編集ボタンクリック:", log.id, e.target);
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      編集
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-destructive hover:bg-accent flex items-center gap-2 menu-action-button"
                      onMouseDown={(e) => {
                        console.log("🗑️ 削除ボタン mousedown:", log.id);
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteLog(log.id);
                        onMenuToggle();
                      }}
                      onClick={(e) => {
                        console.log("🗑️ 削除ボタンクリック:", log.id);
                        e.stopPropagation();
                        e.preventDefault();
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
            <MarkdownPreview
              className={cn(
                !expandedContent && log.note.length > 200
                  ? "line-clamp-[4]"
                  : ""
              )}
            >
              {log.note}
            </MarkdownPreview>
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
  },
  (prevProps, nextProps) => {
    // カスタム比較関数で不要な再レンダリングを防ぐ
    const logId = prevProps.log.id;

    const checks = {
      logId: prevProps.log.id === nextProps.log.id,
      title: prevProps.log.title === nextProps.log.title,
      note: prevProps.log.note === nextProps.log.note,
      learningTime: prevProps.log.learningTime === nextProps.log.learningTime,
      logDate: prevProps.log.logDate === nextProps.log.logDate,
      effectScore: prevProps.log.effectScore === nextProps.log.effectScore,
      effectType: prevProps.log.effectType === nextProps.log.effectType,
      isDeleting: prevProps.isDeleting === nextProps.isDeleting,
      sessionUserId:
        prevProps.session?.user?.id === nextProps.session?.user?.id,
      tags:
        JSON.stringify(prevProps.log.tags) ===
        JSON.stringify(nextProps.log.tags),
      resources:
        JSON.stringify(prevProps.log.resources) ===
        JSON.stringify(nextProps.log.resources),
      onEdit: prevProps.onEdit === nextProps.onEdit,
      onDeleteLog: prevProps.onDeleteLog === nextProps.onDeleteLog,
      isMenuOpen: prevProps.isMenuOpen === nextProps.isMenuOpen,
      onMenuToggle: prevProps.onMenuToggle === nextProps.onMenuToggle,
    };

    const shouldUpdate = Object.values(checks).every(Boolean);

    // 関数参照の変化をデバッグ
    if (!checks.onEdit || !checks.onDeleteLog || !checks.onMenuToggle) {
      console.log(`🔍 LogCard ${logId} 関数参照変化:`, {
        onEdit: checks.onEdit,
        onDeleteLog: checks.onDeleteLog,
        onMenuToggle: checks.onMenuToggle,
        onEditPrev: prevProps.onEdit,
        onEditNext: nextProps.onEdit,
        onDeleteLogPrev: prevProps.onDeleteLog,
        onDeleteLogNext: nextProps.onDeleteLog,
      });
    }

    return shouldUpdate;
  }
);

// 一時的に比較関数を無効化してテスト
// export default LogCard;
export default memo(LogCard);
