import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseUnitLikeOptions {
  onSuccess?: (isLiked: boolean) => void;
  onError?: (error: Error) => void;
}

export function useUnitLike(options: UseUnitLikeOptions = {}) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLike = async (
    unitId: number,
    currentLikedState: boolean,
    mutateFunction: any
  ) => {
    // 未ログインチェック
    if (!session?.user) {
      toast.error(
        "いいねするにはログインが必要です。右上のログインボタンからログインしてください。"
      );
      return;
    }

    const isCurrentlyLiked = currentLikedState;

    try {
      // API呼び出し
      const response = await fetch(`/api/units/${unitId}/like`, {
        method: isCurrentlyLiked ? "DELETE" : "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "いいねの更新に失敗しました");
      }

      // 成功時の処理
      toast.success(
        isCurrentlyLiked ? "いいねを解除しました" : "いいねしました"
      );

      // カスタムコールバック実行
      options.onSuccess?.(isCurrentlyLiked);

      // データ再取得
      await mutateFunction();
    } catch (error) {
      console.error("いいねの更新中にエラーが発生しました:", error);
      const errorMessage =
        error instanceof Error ? error.message : "いいねの更新に失敗しました";
      toast.error(errorMessage);

      // エラーコールバック実行
      options.onError?.(
        error instanceof Error ? error : new Error(errorMessage)
      );

      // データ再取得（元の状態に戻す）
      await mutateFunction();
    }
  };

  return { handleLike };
}
