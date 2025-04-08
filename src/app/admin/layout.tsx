"use client";

import { Button } from "@/components/ui/button";
import { FileText, Home, Settings, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 未認証ユーザーをリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // セッションのロード中は表示しない
  if (status === "loading") {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  // 認証されていない場合は何も表示しない
  if (!session) {
    return null;
  }

  // 将来的に管理者ロールを実装する場合はここでチェック

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* サイドバー */}
        <div className="w-64 bg-white shadow-sm h-screen p-4 flex flex-col">
          <div className="mb-8 p-2">
            <h1 className="text-xl font-bold">管理ダッシュボード</h1>
          </div>

          <nav className="flex-1 space-y-2">
            <Link href="/" passHref>
              <Button variant="ghost" className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                サイトに戻る
              </Button>
            </Link>

            <Link href="/admin" passHref>
              <Button
                variant={isActive("/admin") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Shield className="mr-2 h-4 w-4" />
                ダッシュボード
              </Button>
            </Link>

            <Link href="/admin/logs" passHref>
              <Button
                variant={isActive("/admin/logs") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <FileText className="mr-2 h-4 w-4" />
                エラーログ
              </Button>
            </Link>

            <Link href="/admin/settings" passHref>
              <Button
                variant={isActive("/admin/settings") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                設定
              </Button>
            </Link>
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
