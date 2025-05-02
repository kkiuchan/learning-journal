import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "サイトマップ",
  description: "Learning Journalのサイトマップです。",
};

const siteMap = {
  メイン: [
    { label: "ホーム", href: "/" },
    { label: "ダッシュボード", href: "/dashboard" },
    { label: "学習ユニット", href: "/units" },
    { label: "学習ログ", href: "/logs" },
  ],
  アカウント: [
    { label: "プロフィール", href: "/profile" },
    { label: "設定", href: "/settings" },
    { label: "通知", href: "/notifications" },
  ],
  コミュニティ: [
    { label: "フォーラム", href: "/forum" },
    { label: "メンバー", href: "/members" },
    { label: "イベント", href: "/events" },
  ],
  サポート: [
    { label: "ヘルプセンター", href: "/help" },
    { label: "よくある質問", href: "/faq" },
    { label: "お問い合わせ", href: "/contact" },
  ],
  法的情報: [
    { label: "利用規約", href: "/terms" },
    { label: "プライバシーポリシー", href: "/privacy" },
    { label: "特定商取引法に基づく表記", href: "/legal" },
  ],
  その他: [
    { label: "会社概要", href: "/company" },
    { label: "採用情報", href: "/careers" },
    { label: "ブログ", href: "/blog" },
  ],
};

export default function SitemapPage() {
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
