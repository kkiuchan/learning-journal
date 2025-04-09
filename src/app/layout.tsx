import { Providers } from "@/components/providers";
import { validateEnv } from "@/lib/env";
import { generateSecurityHeaders } from "@/lib/security";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// サーバーコンポーネントでのみ、かつ開発環境でのみ環境変数のバリデーションを実行
if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
  validateEnv();
  console.log("✅ 環境変数の検証が完了しました");
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  title: {
    template: "%s | Learning Journal",
    default: "Learning Journal - 自分の学習を記録・共有できるアプリ",
  },
  description:
    "学習の記録と振り返りができる学習管理アプリ。目標設定から進捗管理、振り返りまでをサポートし、他のユーザーと学びを共有できます。",
  keywords: [
    "学習記録",
    "学習管理",
    "振り返り",
    "目標設定",
    "進捗管理",
    "ポートフォリオ",
  ],
  authors: [{ name: "Learning Journal Team" }],
  creator: "Learning Journal Team",
  publisher: "Learning Journal",
  applicationName: "Learning Journal",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "./",
    siteName: "Learning Journal",
    title: "Learning Journal - 自分の学習を記録・共有できるアプリ",
    description:
      "学習の記録と振り返りができる学習管理アプリ。目標設定から進捗管理、振り返りまでをサポートし、他のユーザーと学びを共有できます。",
    images: [
      {
        url: "/og-image.png", // ルートの公開ディレクトリに配置するOG画像
        width: 1200,
        height: 630,
        alt: "Learning Journal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learning Journal - 自分の学習を記録・共有できるアプリ",
    description:
      "学習の記録と振り返りができる学習管理アプリ。目標設定から進捗管理、振り返りまでをサポートし、他のユーザーと学びを共有できます。",
    images: ["/og-image.png"],
    creator: "@learning_journal",
    site: "@learning_journal",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      {
        rel: "manifest",
        url: "/manifest.json",
      },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "./",
    languages: {
      "ja-JP": "/",
    },
  },
};

// セキュリティヘッダーを設定
export function headers() {
  return generateSecurityHeaders();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script src="/sw-register.js" defer />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
