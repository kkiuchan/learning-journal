"use client";

import { resendConfirmationEmail } from "@/lib/supabase-auth";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function VerifyNoticeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("メールアドレスが見つかりません");
      return;
    }

    try {
      setIsResending(true);

      const { error } = await resendConfirmationEmail(email);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("確認メールを再送信しました");
    } catch (error) {
      console.error("確認メール再送信エラー:", error);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            確認メールを送信しました
          </h1>

          <div className="mb-6">
            <Mail className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              ご登録いただいたメールアドレスに確認メールを送信しました。
              メール内のリンクをクリックして、アカウントを有効化してください。
            </p>
            <p className="text-sm text-gray-500">
              ※ メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
          </div>

          {email && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                メールが届かない場合は、再送信できます：
              </p>
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    送信中...
                  </>
                ) : (
                  "確認メールを再送信"
                )}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/auth/supabase-login"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ログインページに戻る
            </Link>

            <Link
              href="/"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ホームページに戻る
            </Link>
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
