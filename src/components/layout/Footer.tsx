"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
  target?: string;
};

type FooterSection = {
  title: string;
  items: FooterLink[];
};

const footerLinks: Record<string, FooterSection> = {
  app: {
    title: "アプリケーション",
    items: [
      { label: "機能紹介", href: "/features" },
      { label: "使い方ガイド", href: "/guide" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "利用規約", href: "/terms" },
      { label: "特定商取引法に基づく表示", href: "/legal" },
    ],
  },
  resources: {
    title: "リソース",
    items: [
      {
        label: "ソースコード",
        href: "https://github.com/kkiuchan/learning-journal",
        target: "_blank",
      },
      { label: "サイトマップ", href: "/sitemap" },
    ],
  },
};

const socialLinks = [
  { icon: "github", href: "https://github.com/kkiuchan/learning-journal" },
];

export function Footer() {
  return (
    <footer className="w-full border-t bg-background shrink-0">
      <div className="container mx-auto px-4 py-8 md:px-8">
        {/* メインフッターコンテンツ */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                      target={item.target}
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
              © {new Date().getFullYear()} Learning Journal
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
