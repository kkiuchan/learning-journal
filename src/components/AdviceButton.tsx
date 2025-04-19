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
import { Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTrialDialogOpen, setIsTrialDialogOpen] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

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

    // 毎回トライアル確認ダイアログを表示
    setIsTrialDialogOpen(true);
  };

  const fetchAdvice = async () => {
    try {
      setIsLoading(true);
      setAdvice("");
      setIsOpen(true);

      const response = await fetch("/api/advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unitId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
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
            size="default"
            onClick={handleAdviceClick}
            disabled={isLoading || !isOwner}
            className={`relative ${
              isOwner
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } transition-all duration-300`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                アドバイスを取得中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                AIアドバイスを取得
              </>
            )}
            <span className="absolute -top-3 -right-3 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
              無料トライアル
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
                <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4 bg-gray-50">
                  {advice.split("\n").map((line, index) => (
                    <p key={index} className="mb-2">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">アドバイスを生成中...</p>
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

      {/* トライアル確認用ダイアログ */}
      <Dialog open={isTrialDialogOpen} onOpenChange={setIsTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AIアドバイス機能（無料トライアル）</DialogTitle>
            <DialogDescription>
              AIアシスタントが学習内容を分析し、改善のためのアドバイスを提供します。
              この機能は現在、無料トライアルとしてご提供しています。
              期間中は自由にお試しいただけますが、今後有料機能となる可能性があります。
              ぜひご活用ください！
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTrialDialogOpen(false);
                setIsOpen(false);
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleTrialConfirm}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              今すぐ試す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
