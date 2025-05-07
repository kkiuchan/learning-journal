"use client";

import { cn } from "@/lib/utils";
import { Log } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion, useMotionValue } from "framer-motion";
import { ChevronUp, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TableOfContentsProps {
  logs: Log[];
}

interface Position {
  x: number;
  y: number;
}

const DEFAULT_POSITION: Position = {
  x: 0,
  y: 100,
};

export function TableOfContents({ logs }: TableOfContentsProps) {
  const [isClient, setIsClient] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLogId, setActiveLogId] = useState<number | null>(null);
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const dragRef = useRef<HTMLDivElement>(null);

  // モーション値の初期化
  const x = useMotionValue(DEFAULT_POSITION.x);
  const y = useMotionValue(DEFAULT_POSITION.y);

  // 位置が変更されたときの処理
  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: any
  ) => {
    if (!isClient) return;

    // 画面の境界を取得
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const elementWidth = dragRef.current?.offsetWidth || 0;
    const elementHeight = dragRef.current?.offsetHeight || 0;

    // 現在の位置を取得
    const currentRect = dragRef.current?.getBoundingClientRect();
    if (!currentRect) return;

    // 境界制限を適用
    const boundedX = Math.min(
      Math.max(0, currentRect.left),
      windowWidth - elementWidth
    );
    const boundedY = Math.min(
      Math.max(0, currentRect.top),
      windowHeight - elementHeight
    );

    const newPosition = {
      x: boundedX,
      y: boundedY,
    };

    setPosition(newPosition);

    // ローカルストレージに位置を保存
    try {
      localStorage.setItem("tocPosition", JSON.stringify(newPosition));
    } catch (error) {
      console.error("Error saving position:", error);
    }
  };

  // 初期位置の設定
  useEffect(() => {
    setIsClient(true);

    // デフォルトの位置を設定（画面右側）
    const defaultPosition = {
      x: Math.max(0, window.innerWidth - 300),
      y: 100,
    };

    try {
      const saved = localStorage.getItem("tocPosition");
      if (saved) {
        const savedPosition = JSON.parse(saved);
        // 画面の境界をチェック
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementWidth = 256; // w-64 = 16rem = 256px
        const elementHeight = 400; // おおよその高さ

        const boundedX = Math.min(
          Math.max(0, savedPosition.x),
          windowWidth - elementWidth
        );
        const boundedY = Math.min(
          Math.max(0, savedPosition.y),
          windowHeight - elementHeight
        );

        setPosition({ x: boundedX, y: boundedY });
      } else {
        setPosition(defaultPosition);
      }
    } catch (error) {
      console.error("Error loading saved position:", error);
      setPosition(defaultPosition);
    }
  }, []);

  // ウィンドウリサイズ時の位置調整
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const elementWidth = dragRef.current?.offsetWidth || 256;
      const elementHeight = dragRef.current?.offsetHeight || 400;

      const boundedX = Math.min(
        Math.max(0, position.x),
        windowWidth - elementWidth
      );
      const boundedY = Math.min(
        Math.max(0, position.y),
        windowHeight - elementHeight
      );

      if (boundedX !== position.x || boundedY !== position.y) {
        const newPosition = { x: boundedX, y: boundedY };
        setPosition(newPosition);
        x.set(boundedX);
        y.set(boundedY);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position, isClient]);

  const scrollToLog = (logId: number) => {
    const element = document.getElementById(`log-${logId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setActiveLogId(logId);
      if (window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    }
  };

  if (!isClient || logs.length === 0) return null;

  // モバイル表示用のコンポーネント
  const MobileView = ({
    logs,
    isExpanded,
    setIsExpanded,
    activeLogId,
    scrollToLog,
  }: {
    logs: Log[];
    isExpanded: boolean;
    setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    activeLogId: number | null;
    scrollToLog: (logId: number) => void;
  }) => (
    <motion.div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t z-50 transition-transform duration-300 lg:hidden",
        !isExpanded && "translate-y-[calc(100%-3rem)]"
      )}
      initial={false}
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={{
        expanded: { y: 0 },
        collapsed: { y: "calc(100% - 3rem)" },
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 text-sm font-medium"
      >
        <span>学習ログ一覧</span>
        <ChevronUp
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            !isExpanded && "rotate-180"
          )}
        />
      </button>
      <motion.div
        className={cn(
          "overflow-y-auto bg-background",
          isExpanded ? "max-h-[70vh] p-4" : "max-h-0"
        )}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="space-y-2">
          {logs.map((log) => (
            <button
              key={log.id}
              onClick={() => scrollToLog(log.id)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                activeLogId === log.id && "bg-accent font-medium"
              )}
            >
              <div className="line-clamp-2 min-h-[2.5rem]">{log.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(log.logDate), "yyyy年MM月dd日", {
                  locale: ja,
                })}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  // デスクトップ表示用のコンポーネント
  const DesktopView = ({
    logs,
    dragRef,
    position,
    activeLogId,
    scrollToLog,
  }: {
    logs: Log[];
    dragRef: React.RefObject<HTMLDivElement>;
    position: Position;
    activeLogId: number | null;
    scrollToLog: (logId: number) => void;
  }) => (
    <motion.div
      ref={dragRef}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      initial={false}
      style={{
        position: "fixed",
        top: position.y,
        left: position.x,
        touchAction: "none",
      }}
      className="hidden lg:block bg-background rounded-lg border shadow-lg p-4 w-64 z-50"
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
      whileTap={{ cursor: "grabbing" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">学習ログ一覧</div>
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
      </div>
      <div
        className={cn(
          "space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400",
          "max-h-[400px]"
        )}
      >
        {logs.map((log) => (
          <button
            key={log.id}
            onClick={() => scrollToLog(log.id)}
            className={cn(
              "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
              activeLogId === log.id && "bg-accent font-medium"
            )}
          >
            <div className="line-clamp-2 min-h-[2.5rem]">{log.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(new Date(log.logDate), "yyyy年MM月dd日", { locale: ja })}
            </div>
          </button>
        ))}
      </div>
      {logs.length > 5 && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          ↕ スクロールで全て表示
        </div>
      )}
    </motion.div>
  );

  return (
    <>
      <MobileView
        logs={logs}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeLogId={activeLogId}
        scrollToLog={scrollToLog}
      />
      <DesktopView
        logs={logs}
        dragRef={dragRef}
        position={position}
        activeLogId={activeLogId}
        scrollToLog={scrollToLog}
      />
    </>
  );
}
