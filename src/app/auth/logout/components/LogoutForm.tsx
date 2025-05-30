"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LogoutForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 未ログインの場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "loading") return; // まだ読み込み中
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
      toast.success("ログアウトしました");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      toast.error("ログアウト中にエラーが発生しました");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // ローディング中の表示
  if (status === "loading") {
    return (
      <div className="space-y-6 text-center">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  // 未ログインの場合の表示（リダイレクト前の一瞬表示される可能性がある）
  if (status === "unauthenticated") {
    return (
      <div className="space-y-6 text-center">
        <div className="text-muted-foreground">ログインしていません</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
          <LogOut className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">
            ログアウトしますか？
          </h3>
          <p className="text-sm text-muted-foreground">
            {session?.user?.name || session?.user?.email}
            としてログインしています
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full"
          variant="destructive"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              ログアウト中...
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </>
          )}
        </Button>

        <Button
          onClick={handleCancel}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="text-sm text-center space-y-2">
          <p className="text-muted-foreground">
            ログアウト後も学習記録を確認したい場合
          </p>
          <Link
            href="/"
            className="text-primary hover:text-primary/90 font-medium inline-flex items-center"
          >
            <Home className="w-4 h-4 mr-1" />
            ホームページへ
          </Link>
        </div>
      </div>
    </div>
  );
}
