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
    const handleAuthCallback = async () => {
      try {
        console.log("[Callback] Starting auth callback process...");
        console.log(
          "[Callback] Search params:",
          Object.fromEntries(searchParams.entries())
        );

        // URLのハッシュフラグメントも確認
        const hash = window.location.hash;
        console.log("[Callback] URL hash:", hash);

        setMessage("認証コードを処理中...");

        // 重要: Supabaseに認証処理を委任（URL検出を有効にして自動処理）
        let session = null;
        let authError = null;

        // まず現在のセッションを確認
        const { data: initialSession, error: initialError } =
          await supabase.auth.getSession();
        console.log("[Callback] Initial session check:", {
          initialSession,
          initialError,
        });

        session = initialSession.session;

        // セッションがない場合、認証状態変更を待機
        if (!session) {
          console.log(
            "[Callback] No initial session, waiting for auth state change..."
          );

          // 認証状態変更を監視（一度だけ）
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: string, newSession: any) => {
              console.log("[Callback] Auth state change:", event, newSession);
              if (event === "SIGNED_IN" && newSession) {
                session = newSession;
              }
            }
          );

          // 少し待機してから再確認
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const { data: retrySession } = await supabase.auth.getSession();
          console.log("[Callback] Retry session check:", retrySession);

          if (retrySession.session) {
            session = retrySession.session;
          }

          // リスナーをクリーンアップ
          authListener.subscription.unsubscribe();
        }

        const debug = {
          hasSession: !!session,
          sessionId: session?.user?.id || null,
          userEmail: session?.user?.email || null,
          searchParams: Object.fromEntries(searchParams.entries()),
          urlHash: hash,
          codeExchangeSuccess: !authError,
          timestamp: new Date().toISOString(),
        };

        setDebugInfo(debug);
        console.log("[Callback] Debug info:", debug);

        if (!session) {
          setStatus("error");
          setMessage(
            "認証セッションの取得に失敗しました。再度ログインしてください。"
          );
          return;
        }

        console.log("[Callback] Session established:", session);
        setMessage("ユーザー情報を同期中...");

        // バックエンドでユーザー同期
        const response = await fetch("/api/auth/migrate-to-supabase", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        console.log(
          "[Callback] Migration API response status:",
          response.status
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[Callback] Migration API error:", errorData);
          throw new Error(errorData.error || "ユーザー同期に失敗しました");
        }

        const migrationData = await response.json();
        console.log("User sync result:", migrationData);

        // 重要: セッションが確実に設定されるように再確認
        const { data: finalSessionCheck } = await supabase.auth.getSession();
        console.log("[Callback] Final session check:", finalSessionCheck);

        // セッション情報を手動でCookieに設定
        if (finalSessionCheck.session) {
          console.log("[Callback] Setting session cookies manually...");

          // Supabaseのセッションを明示的にrefreshして適切なCookieを設定
          const { data: refreshResult, error: refreshError } =
            await supabase.auth.refreshSession();
          console.log("[Callback] Session refresh result:", {
            refreshResult,
            refreshError,
          });

          // さらに少し待機してCookieの設定を確実にする
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 最終確認
          const { data: postRefreshSession } = await supabase.auth.getSession();
          console.log("[Callback] Post-refresh session:", postRefreshSession);
        }

        setStatus("success");
        setMessage(
          migrationData.data.migrated
            ? "既存データを移行しました"
            : "新規ユーザーを作成しました"
        );

        // セッション確立後にダッシュボードにリダイレクト
        setTimeout(async () => {
          console.log("[Callback] Redirecting to dashboard...");

          // 最終セッション確認
          const { data: preRedirectSession } = await supabase.auth.getSession();
          console.log("[Callback] Pre-redirect session:", preRedirectSession);

          if (preRedirectSession.session) {
            // セッションがある場合は通常のナビゲーション
            router.push("/dashboard");
          } else {
            // セッションがない場合は強制リロード
            console.warn(
              "[Callback] No session before redirect, forcing page reload"
            );
            window.location.href = "/dashboard";
          }
        }, 1500);
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "認証処理でエラーが発生しました"
        );
      }
    };

    handleAuthCallback();
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
