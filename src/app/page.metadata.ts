import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Journal - 学習の記録と振り返りをサポート",
  description:
    "学習の記録、振り返り、共有ができる学習管理アプリです。目標設定から進捗管理、振り返りまで、あなたの学びをサポートします。",
  openGraph: {
    title: "Learning Journal - 学習の記録と振り返りをサポート",
    description:
      "学習の記録、振り返り、共有ができる学習管理アプリです。目標設定から進捗管理、振り返りまで、あなたの学びをサポートします。",
    url: "/",
    images: [
      {
        url: "/api/og?title=Learning Journal&username=学習記録・振り返りアプリ&tags=学習記録,振り返り,学習管理,ポートフォリオ",
        width: 1200,
        height: 630,
        alt: "Learning Journal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learning Journal - 学習の記録と振り返りをサポート",
    description:
      "学習の記録、振り返り、共有ができる学習管理アプリです。目標設定から進捗管理、振り返りまで、あなたの学びをサポートします。",
    images: [
      "/api/og?title=Learning Journal&username=学習記録・振り返りアプリ&tags=学習記録,振り返り,学習管理,ポートフォリオ",
    ],
  },
};
