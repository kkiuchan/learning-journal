import { cn } from "@/lib/utils";
import { Log } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronUp, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TableOfContentsProps {
  logs: Log[];
}

export function TableOfContents({ logs }: TableOfContentsProps) {
  const [activeLogId, setActiveLogId] = useState<number | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const initialMousePosition = useRef<{ x: number; y: number } | null>(null);
  const initialElementPosition = useRef<{ x: number; y: number } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // クライアントサイドでの初期化
  useEffect(() => {
    setIsClient(true);
    const defaultPosition = {
      x: window.innerWidth - 320,
      y: 100,
    };

    try {
      const saved = localStorage.getItem("tocPosition");
      if (saved) {
        const savedPosition = JSON.parse(saved);
        const adjustedPosition = {
          x: Math.min(savedPosition.x, window.innerWidth - 320),
          y: Math.min(savedPosition.y, window.innerHeight - 100),
        };
        setPosition(adjustedPosition);
      } else {
        setPosition(defaultPosition);
      }
    } catch (error) {
      console.error("Error loading saved position:", error);
      setPosition(defaultPosition);
    }
  }, []);

  // IntersectionObserverの初期化と監視の設定
  useEffect(() => {
    if (!isClient) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const logId = Number(entry.target.id.replace("log-", ""));
            setActiveLogId(logId);
          }
        });
      },
      {
        rootMargin: "-20% 0px -80% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isClient]);

  // ログ要素の監視を設定
  useEffect(() => {
    if (!isClient || !observerRef.current || logs.length === 0) return;

    // 既存の監視をクリア
    observerRef.current.disconnect();

    // 各ログ要素を監視
    logs.forEach((log) => {
      const element = document.getElementById(`log-${log.id}`);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [logs, isClient]);

  // ウィンドウリサイズ時の位置調整
  useEffect(() => {
    if (!isClient || !position) return;

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const maxX = window.innerWidth - 320;
        const maxY = window.innerHeight - 100;
        return {
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient, position]);

  // ドラッグ処理
  useEffect(() => {
    if (!isDragging || !position) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!initialMousePosition.current || !initialElementPosition.current)
        return;

      const deltaX = e.clientX - initialMousePosition.current.x;
      const deltaY = e.clientY - initialMousePosition.current.y;

      const newX = initialElementPosition.current.x + deltaX;
      const newY = initialElementPosition.current.y + deltaY;

      const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      initialMousePosition.current = null;
      initialElementPosition.current = null;
      if (position) {
        localStorage.setItem("tocPosition", JSON.stringify(position));
      }
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current || !position) return;

    if (e.button !== 0) return;

    setIsDragging(true);
    document.body.style.userSelect = "none";

    initialMousePosition.current = {
      x: e.clientX,
      y: e.clientY,
    };

    initialElementPosition.current = {
      x: position.x,
      y: position.y,
    };
  };

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

  if (!isClient || !position || logs.length === 0) return null;

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
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t z-50 transition-transform duration-300 lg:hidden",
        !isExpanded && "translate-y-[calc(100%-3rem)]"
      )}
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
      <div
        className={cn(
          "overflow-y-auto bg-background",
          isExpanded ? "max-h-[70vh] p-4" : "max-h-0"
        )}
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
      </div>
    </div>
  );

  // デスクトップ表示用のコンポーネント
  const DesktopView = ({
    logs,
    dragRef,
    isDragging,
    position,
    activeLogId,
    handleMouseDown,
    scrollToLog,
  }: {
    logs: Log[];
    dragRef: React.RefObject<HTMLDivElement>;
    isDragging: boolean;
    position: { x: number; y: number };
    activeLogId: number | null;
    handleMouseDown: (e: React.MouseEvent) => void;
    scrollToLog: (logId: number) => void;
  }) => (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-50 w-64 rounded-lg border bg-card p-4 shadow-sm transition-all duration-300 select-none hidden lg:block",
        isDragging && "shadow-lg cursor-grabbing opacity-90"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        transform: `translate3d(0, 0, 0)`,
        willChange: "transform",
      }}
    >
      <div
        className="flex items-center justify-between mb-4"
        onMouseDown={handleMouseDown}
      >
        <h3 className="font-bold">学習ログ一覧</h3>
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      </div>
      <div
        className={cn(
          "space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400",
          // 1つのコンテンツの高さ（ボタンの高さ）は約80px（padding + line-height + margin）
          // 5つのコンテンツで約400px
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
    </div>
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
        isDragging={isDragging}
        position={position}
        activeLogId={activeLogId}
        handleMouseDown={handleMouseDown}
        scrollToLog={scrollToLog}
      />
    </>
  );
}
