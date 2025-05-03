import { Button } from "@/components/ui/button";
import type { Unit } from "@/types";
import {
  Copy,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import React from "react";

interface SidebarProps {
  unit: Unit;
  session: Session | null;
  id: string;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  handleCopyUrl: () => void;
  copied: boolean;
  handleLike: () => void;
  handleDelete: () => void;
  menuRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>;
  currentUrl: string;
  className?: string;
  commentCount: number;
  onCommentClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  unit,
  session,
  id,
  openMenuId,
  setOpenMenuId,
  handleCopyUrl,
  copied,
  handleLike,
  handleDelete,
  menuRefs,
  currentUrl,
  className = "",
  commentCount,
  onCommentClick,
}) => {
  return (
    <aside
      className={`hidden lg:flex flex-col w-48 h-full px-4 z-30 ${className}`}
    >
      {/* 共有・いいね・3点リーダーなどのボタン群 */}
      <div className="flex flex-col gap-4 items-center mt-4">
        {/* 共有ボタン群 */}
        <div className="flex flex-col gap-3 items-center">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              currentUrl
            )}&text=${encodeURIComponent(unit.title + " | Learning Journal")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black hover:bg-gray-900 text-white shadow transition-colors duration-200"
            title="Xでシェア"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              currentUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow transition-colors duration-200"
            title="Facebookでシェア"
          >
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" />
            </svg>
          </a>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
              currentUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#00B900] hover:bg-[#00a000] text-white shadow transition-colors duration-200"
            title="LINEでシェア"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"></path>
            </svg>
          </a>
          <button
            onClick={handleCopyUrl}
            className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 shadow transition-colors duration-200 relative`}
            title="URLをコピー"
          >
            <Copy className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                コピーしました！
              </span>
            )}
          </button>
        </div>
        {/* いいねボタン */}
        <button
          onClick={handleLike}
          className={`w-8 h-8 flex items-center justify-center rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 shadow transition-colors duration-200 relative`}
          title="いいね"
        >
          <Heart className={`w-4 h-4 ${unit.isLiked ? "fill-current" : ""}`} />
          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-xs font-bold">
            {unit._count?.unitLikes ?? 0}
          </span>
        </button>
        {/* コメントボタン */}
        <button
          onClick={onCommentClick}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow transition-colors duration-200 relative"
          title="コメント"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-xs font-bold">
            {commentCount}
          </span>
        </button>
        {/* 3点リーダー（編集・削除） */}
        {session?.user?.id === unit.userId && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setOpenMenuId(openMenuId === parseInt(id) ? null : parseInt(id))
              }
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
            >
              <div className="py-1">
                <Link href={`/units/${id}/edit`}>
                  <button
                    className="w-full text-left px-4 py-2 text-foreground hover:bg-accent flex items-center gap-2"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <Pencil className="h-3 w-3" />
                    編集
                  </button>
                </Link>
                <button
                  className="w-full text-left px-4 py-2 text-destructive hover:bg-accent flex items-center gap-2"
                  onClick={() => {
                    handleDelete();
                    setOpenMenuId(null);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
