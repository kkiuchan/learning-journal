import { Button } from "@/components/ui/button";
import type { Unit } from "@/types";
import {
  Copy,
  Heart,
  MessageCircle,
  MoreVertical,
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow transition-colors duration-200"
            title="Twitterでシェア"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.932 0 .386.045.763.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 1.997 1.397 3.872 3.448 4.29a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z" />
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white shadow transition-colors duration-200"
            title="LINEでシェア"
          >
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184C17.413 1.13 14.03.06 10.5.06c-3.53 0-6.913 1.07-9.115 3.124C.49 5.13-.001 7.13.001 9.184c.002 2.053.491 4.053 1.384 6.06.893 2.007 2.23 3.87 3.98 5.37.13.11.29.17.46.17.09 0 .18-.02.26-.05l2.77-1.13c.19-.08.41-.03.54.12.37.41.77.8 1.2 1.16.09.08.21.13.33.13.04 0 .09-.01.13-.02.13-.04.24-.13.3-.25l.7-1.52c.07-.15.02-.33-.12-.42-.36-.25-.7-.53-1.01-.83-.13-.13-.16-.33-.07-.48.09-.15.27-.21.43-.14l2.13.87c.08.03.17.05.26.05.09 0 .18-.02.26-.05 1.75-1.5 3.09-3.36 3.98-5.37.89-2.01 1.38-4.01 1.38-6.06.01-2.05-.48-4.05-1.38-6.06z" />
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
            {unit._count.unitLikes}
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
              className="w-8 h-8"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(
                  openMenuId === parseInt(id) ? null : parseInt(id)
                );
              }}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            <div
              ref={(el) => {
                if (el) {
                  menuRefs.current[parseInt(id)] = el;
                }
              }}
              className={`absolute left-10 top-0 bg-background rounded-md shadow-lg z-10 border transition-all duration-200 ease-in-out min-w-[120px] ${
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
