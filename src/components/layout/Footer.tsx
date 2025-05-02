"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const footerLinks = {
  product: {
    title: "プロダクト",
    items: [
      { label: "機能紹介", href: "/features" },
      { label: "使い方ガイド", href: "/guide" },
      { label: "料金プラン", href: "/pricing" },
      { label: "よくある質問", href: "/faq" },
    ],
  },
  company: {
    title: "会社情報",
    items: [
      { label: "運営会社", href: "/company" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "利用規約", href: "/terms" },
      { label: "お問い合わせ", href: "/contact" },
    ],
  },
  resources: {
    title: "リソース",
    items: [
      { label: "ブログ", href: "/blog" },
      { label: "開発ロードマップ", href: "/roadmap" },
      { label: "ステータス", href: "/status" },
      { label: "API ドキュメント", href: "/api-docs" },
    ],
  },
};

const socialLinks = [
  { icon: "twitter", href: "https://twitter.com/learning_journal" },
  { icon: "github", href: "https://github.com/learning-journal" },
  { icon: "discord", href: "https://discord.gg/learning-journal" },
];

export function Footer() {
  return (
    <footer className="w-full border-t bg-background shrink-0">
      <div className="container mx-auto px-4 py-8 md:px-8">
        {/* メインフッターコンテンツ */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* ブランドセクション */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Icons.logo className="h-6 w-6" />
              <span className="font-bold">Learning Journal</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              学習の記録と振り返りで、
              <br />
              あなたの成長をサポートします。
            </p>
            {/* ソーシャルリンク */}
            <div className="flex space-x-4">
              {socialLinks.map((link) => {
                const Icon = Icons[link.icon as keyof typeof Icons];
                return (
                  <Button key={link.icon} variant="ghost" size="icon" asChild>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{link.icon}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* リンクセクション */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} className="space-y-4">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* コピーライト */}
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Learning Journal. All rights
              reserved.
            </p>
            <div className="flex space-x-4">
              <Button variant="link" size="sm" asChild>
                <Link href="/privacy">プライバシー</Link>
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link href="/terms">利用規約</Link>
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link href="/sitemap">サイトマップ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
