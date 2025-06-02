import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnimatedLayout } from "@/components/motion/AnimatedLayout";
import { Providers } from "@/components/providers";
import { MenuProvider } from "@/contexts/MenuContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { validateEnv } from "@/lib/env";
import { notoSansJP } from "@/lib/fonts";
import { generateSecurityHeaders } from "@/lib/security";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { GlobalModals } from "./components/GlobalModals";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
        url: "/logo.png", // ルートの公開ディレクトリに配置するOG画像
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
    images: ["/logo.png"],
    creator: "@learning_journal",
    site: "@learning_journal",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script src="/sw-register.js" defer />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          notoSansJP.variable
        )}
      >
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <MenuProvider>
            <ModalProvider>
              <Providers>
                <div className="flex flex-col flex-1">
                  <Header />
                  <main className="flex-1 flex flex-col">
                    <AnimatedLayout>{children}</AnimatedLayout>
                  </main>
                  <Footer />
                </div>
              </Providers>
              <GlobalModals />
              <Toaster />
            </ModalProvider>
          </MenuProvider>
        </NextThemesProvider>
        <Analytics />
      </body>
    </html>
  );
}
