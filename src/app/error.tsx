"use client";

import { Button } from "@/components/ui/button";
import { logError } from "@/lib/error-logger";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error("アプリケーションエラー:", error);
    logError(error).catch(console.error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            予期せぬエラーが発生しました
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            申し訳ありませんが、問題が発生しました。もう一度お試しください。
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Button onClick={reset} className="w-full" variant="default">
            もう一度試す
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full"
            variant="outline"
          >
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
