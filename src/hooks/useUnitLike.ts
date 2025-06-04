import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { AuthSession } from "@/types/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseUnitLikeOptions {
  onSuccess?: (isLiked: boolean) => void;
  onError?: (error: Error) => void;
}

export function useUnitLike(
  options: UseUnitLikeOptions = {},
  providedSession?: AuthSession | null
) {
  const { session: supabaseSession } = useSupabaseAuth();
  const router = useRouter();

  // 提供されたセッションまたはSupabaseセッションを使用
  const sessionToUse =
    providedSession ||
    (supabaseSession
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
      : null);

  const handleLike = async (
    unitId: number,
    currentLikedState: boolean,
    mutateFunction: any
  ) => {
    console.log("useUnitLike handleLike called:", {
      providedSession,
      supabaseSession,
      sessionToUse,
      hasUser: !!sessionToUse?.user,
      userId: sessionToUse?.user?.id,
      hasAccessToken: !!supabaseSession?.access_token,
    });

    // 未ログインチェック
    if (!sessionToUse?.user) {
      console.log("No session or user, showing login error");
      toast.error(
        "いいねするにはログインが必要です。右上のログインボタンからログインしてください。"
      );
      return;
    }

    const isCurrentlyLiked = currentLikedState;

    try {
      // 認証ヘッダーの準備
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Supabase認証トークンを追加
      if (supabaseSession?.access_token) {
        headers.Authorization = `Bearer ${supabaseSession.access_token}`;
        console.log("Added Authorization header with token");
      } else {
        console.log("No access token available");
      }

      console.log(
        "Making API request to /api/units/${unitId}/like with headers:",
        headers
      );

      // API呼び出し
      const response = await fetch(`/api/units/${unitId}/like`, {
        method: isCurrentlyLiked ? "DELETE" : "POST",
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("API request failed:", {
          status: response.status,
          statusText: response.statusText,
          error: data,
        });
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
