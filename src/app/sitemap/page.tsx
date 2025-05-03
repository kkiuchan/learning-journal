import { authConfig } from "@/auth.config";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: "サイトマップ",
  description: "Learning Journalのサイトマップです。",
};

type SiteMapLink = {
  label: string;
  href: string;
  target?: string;
};

type SiteMapSection = {
  [key: string]: SiteMapLink[];
};

export default async function SitemapPage() {
  const session = await getServerSession(authConfig);

  const siteMap: SiteMapSection = {
    メイン: [
      { label: "ホーム", href: "/" },
      { label: "ダッシュボード", href: "/dashboard" },
      { label: "学習ユニット", href: "/units" },
      { label: "学習ログ", href: "/logs" },
    ],
    アプリケーション: [
      { label: "機能紹介", href: "/features" },
      { label: "使い方ガイド", href: "/guide" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "利用規約", href: "/terms" },
    ],
    アカウント: [
      { label: "ログイン", href: "/auth/login" },
      {
        label: "プロフィール",
        href: session?.user?.id ? `/users/${session.user.id}` : "/auth/login",
      },
      { label: "設定", href: "/settings" },
    ],
    リソース: [
      {
        label: "ソースコード",
        href: "https://github.com/kkiuchan/learning-journal",
        target: "_blank",
      },
      { label: "サイトマップ", href: "/sitemap" },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">サイトマップ</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(siteMap).map(([category, links]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold">{category}</h2>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.target}
                    className="text-muted-foreground hover:text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t pt-8">
        <p className="text-sm text-muted-foreground">
          ※ 一部のページは開発中または準備中の場合があります。
        </p>
      </div>
    </div>
  );
}
