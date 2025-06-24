"use client";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { supabase } from "@/lib/supabase-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCard } from "../components/AuthCard";

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
        if (session?.user) {
          setStatus("success");
          setMessage("認証が完了しました。ダッシュボードに移動中...");

          // 少し待ってからリダイレクト
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          throw new Error("セッションが無効です");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "認証処理でエラーが発生しました"
        );
      }
    };

    handleAuthCallback();

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, [router, searchParams]);

  return (
    <AuthCard
      title={
        status === "loading"
          ? "認証中"
          : status === "success"
            ? "認証完了"
            : "認証エラー"
      }
    >
      <div className="text-center">
        {status === "loading" && (
          <div className="mb-6">
            <Loading size="lg" />
          </div>
        )}

        {status === "success" && (
          <div className="text-green-600 dark:text-green-400 text-5xl mb-6">
            ✓
          </div>
        )}

        {status === "error" && (
          <div className="text-destructive text-5xl mb-6">✗</div>
        )}

        <p className="text-muted-foreground mb-6">{message}</p>

        {status === "error" && (
          <div className="space-y-4">
            <Button
              onClick={() => (window.location.href = "/auth/supabase-login")}
              className="w-full"
            >
              ログインページに戻る
            </Button>
          </div>
        )}

        {debugInfo && process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">
              デバッグ情報
            </summary>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </AuthCard>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <AuthCard title="認証中">
          <div className="text-center">
            <div className="mb-6">
              <Loading size="lg" />
            </div>
            <p className="text-muted-foreground">認証情報を読み込み中...</p>
          </div>
        </AuthCard>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
