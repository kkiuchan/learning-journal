import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { AuthSession } from "@/types/auth";
import { Crown, Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface AdviceButtonProps {
  unitId: string;
  onAddComment?: (comment: string) => void;
  userId?: string;
}

export function AdviceButton({
  unitId,
  onAddComment,
  userId,
}: AdviceButtonProps) {
  const { session: supabaseSession } = useAuthStore();

  // Supabaseセッションを NextAuth.js 互換形式に変換
  const session: AuthSession | null = supabaseSession
    ? {
        user: {
          id: supabaseSession.user.id,
          email: supabaseSession.user.email || "",
          name:
            supabaseSession.user.user_metadata?.name ||
            supabaseSession.user.user_metadata?.full_name ||
            "",
          image:
            supabaseSession.user.user_metadata?.avatar_url ||
            supabaseSession.user.user_metadata?.picture ||
            "",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : null;

  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTrialDialogOpen, setIsTrialDialogOpen] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isPlanLimitDialogOpen, setIsPlanLimitDialogOpen] = useState(false);

  // ユニットの所有者とセッションユーザーが一致するか確認
  const isOwner = session?.user?.id === userId;

  const handleTrialConfirm = () => {
    setIsTrialDialogOpen(false);
    fetchAdvice();
  };

  const handleAdviceClick = () => {
    if (!isOwner) {
      toast.error("自分のユニットでのみAIアドバイスを取得できます");
      return;
    }

    // プラン制限の確認なしに直接実行（APIで制限チェック）
    fetchAdvice();
  };

  const fetchAdvice = async () => {
    try {
      setIsLoading(true);
      setAdvice("");
      setIsOpen(true);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Supabaseセッションのアクセストークンを追加
      if (supabaseSession?.access_token) {
        headers["Authorization"] = `Bearer ${supabaseSession.access_token}`;
      }

      const response = await fetch("/api/advice", {
        method: "POST",
        headers,
        body: JSON.stringify({ unitId }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // プラン制限エラーの場合
        if (errorData.code === "PLAN_LIMIT_EXCEEDED") {
          setIsOpen(false);
          setIsPlanLimitDialogOpen(true);
          return;
        }

        throw new Error(errorData.error || "アドバイスの取得に失敗しました");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("レスポンスの読み取りに失敗しました");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (
                data.event === "content" &&
                data.data.choices[0]?.delta?.content
              ) {
                setAdvice((prev) => prev + data.data.choices[0].delta.content);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching advice:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "アドバイスの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!advice) return;

    try {
      setIsAddingComment(true);

      // コメントを追加する関数を呼び出す
      if (onAddComment) {
        onAddComment(advice);
        toast.success("アドバイスをコメントとして追加しました");
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("コメントの追加に失敗しました");
    } finally {
      setIsAddingComment(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={handleAdviceClick}
            disabled={isLoading || !isOwner}
            className={`relative text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 ${
              isOwner
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } transition-all duration-300`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 animate-spin" />
                <span className="hidden sm:inline">生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">AIアドバイス</span>
              </>
            )}
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full">
              PRO
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] w-[90vw] max-w-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
              学習アドバイス
            </DialogTitle>
            <DialogDescription>
              このアドバイスは、あなたの学習状況に基づいて生成されています。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {advice ? (
                <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4 bg-card">
                  {advice.split("\n").map((line, index) => (
                    <p key={index} className="mb-2">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">アドバイスを生成中...</p>
              )}
            </div>
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {advice && !isLoading && (
            <DialogFooter className="mt-4">
              <Button
                onClick={handleAddComment}
                disabled={isAddingComment}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isAddingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    追加中...
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    コメントとして追加
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* プラン制限ダイアログ */}
      <Dialog
        open={isPlanLimitDialogOpen}
        onOpenChange={setIsPlanLimitDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Crown className="mr-2 h-5 w-5 text-yellow-500" />
              プロプラン限定機能
            </DialogTitle>
            <DialogDescription>
              AIアドバイス機能はプロプランの限定機能です。
              プロプランにアップグレードして、AI powered
              な学習体験をお楽しみください。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              プロプランの特典
            </h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• AIアドバイス機能</li>
              <li>• AI学習サジェスト機能</li>
              <li>• 無制限の学習ユニット・ログ</li>
              <li>• 詳細分析・レポート機能</li>
              <li>• プライベートユニット作成</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPlanLimitDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-medium shadow-lg hover:from-yellow-600 hover:to-orange-700"
            >
              <Link href="/pricing">
                <Crown className="mr-2 h-4 w-4" />
                プロプランを見る
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
