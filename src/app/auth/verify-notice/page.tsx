"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function VerifyNoticeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) return;

    try {
      setIsResending(true);
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      toast.success("確認メールを再送信しました");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "確認メールの送信に失敗しました"
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            メールを確認してください
          </h2>
          <div className="mt-4 text-muted-foreground">
            <p>{email} 宛に確認メールを送信しました。</p>
            <p className="mt-2">
              メール内のリンクをクリックして、メールアドレスの確認を完了してください。
            </p>
            <p className="mt-2">
              確認が完了するまで、ログインすることはできません。
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              メールが届いていない場合は、以下のボタンから再送信できます。
            </p>
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isResending ? "送信中..." : "確認メールを再送信"}
            </button>
          </div>

          <div className="mt-8 text-sm">
            <p className="text-muted-foreground">
              ※ 確認メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyNoticePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyNoticeContent />
    </Suspense>
  );
}
