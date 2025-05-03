"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        if (!token) {
          setError("トークンが見つかりません");
          return;
        }

        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        toast.success("メールアドレスの確認が完了しました");
        // 3秒後にダッシュボードにリダイレクト
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "エラーが発生しました"
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            メールアドレスの確認
          </h2>
          <div className="mt-4">
            {verifying ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-sm text-muted-foreground">
                  メールアドレスを確認中...
                </p>
              </div>
            ) : error ? (
              <div className="text-destructive text-sm">{error}</div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>メールアドレスの確認が完了しました。</p>
                <p>まもなくダッシュボードにリダイレクトします...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
