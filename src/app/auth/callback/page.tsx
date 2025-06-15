"use client";

import { supabase } from "@/lib/supabase-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AuthCallbackContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("認証を処理中...");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const handleAuthCallback = async () => {
      try {
        setMessage("認証コードを処理中...");
        // まず現在のセッションを確認
        const { data: initialSession } = await supabase.auth.getSession();
        let session = initialSession.session;
        if (!session) {
          // 認証状態変更を監視（一度だけ）
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(
            async (event: string, newSession: any) => {
              if (event === "SIGNED_IN" && newSession) {
                session = newSession;
                proceed(session);
              }
            }
          );
          unsub = () => subscription.unsubscribe();
          // 監視開始後、初回セッションが既にある場合は即進める
          return;
        }
        // 既にセッションがある場合
        proceed(session);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "認証処理でエラーが発生しました"
        );
      }
    };

    const proceed = async (session: any) => {
      try {
        setDebugInfo({
          hasSession: !!session,
          sessionId: session?.user?.id || null,
          userEmail: session?.user?.email || null,
          searchParams: Object.fromEntries(searchParams.entries()),
          timestamp: new Date().toISOString(),
        });
        setMessage("ユーザー情報を同期中...");
        // バックエンドでユーザー同期
        const response = await fetch("/api/auth/migrate-to-supabase", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "ユーザー同期に失敗しました");
        }
        const migrationData = await response.json();
        setStatus("success");
        setMessage(
          migrationData.data?.migrated
            ? "既存データを移行しました"
            : "新規ユーザーを作成しました"
        );
        // 認証完了後にダッシュボードへ遷移
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "認証処理でエラーが発生しました"
        );
      } finally {
        if (unsub) unsub();
      }
    };

    handleAuthCallback();
    // クリーンアップ
    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === "loading" && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          )}

          {status === "success" && (
            <div className="text-green-600 text-5xl mb-4">✓</div>
          )}

          {status === "error" && (
            <div className="text-red-600 text-5xl mb-4">✗</div>
          )}

          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {status === "loading"
              ? "認証中"
              : status === "success"
                ? "認証完了"
                : "認証エラー"}
          </h1>

          <p className="text-gray-600 mb-6">{message}</p>

          {status === "error" && (
            <div className="space-y-4">
              <button
                onClick={() => (window.location.href = "/auth/signin")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                ログインページに戻る
              </button>
            </div>
          )}

          {debugInfo && process.env.NODE_ENV === "development" && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                デバッグ情報
              </summary>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                認証中
              </h1>
              <p className="text-gray-600">認証情報を読み込み中...</p>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
