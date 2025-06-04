"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをコンソールにログ出力
    console.error("Next.js Error Page:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-red-600">エラーが発生しました</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            ページの読み込み中にエラーが発生しました。
          </p>
          <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
            <div>
              <strong>エラー:</strong> {error.message}
            </div>
            {error.digest && (
              <div>
                <strong>Digest:</strong> {error.digest}
              </div>
            )}
            <div>
              <strong>Stack:</strong> {error.stack?.slice(0, 200)}...
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset}>再試行</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
