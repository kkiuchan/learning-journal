import { Metadata } from "next";

export const metadata: Metadata = {
  title: "学習ユニット一覧",
  description:
    "様々なユーザーの学習ユニット一覧です。学びのアイデアを探したり、自分の学習を記録・共有しましょう。",
  openGraph: {
    title: "学習ユニット一覧 | Learning Journal",
    description:
      "様々なユーザーの学習ユニット一覧です。学びのアイデアを探したり、自分の学習を記録・共有しましょう。",
    url: "/units",
    images: [
      {
        url: "/api/og?title=学習ユニット一覧&username=Learning Journal&tags=学習記録,振り返り,学習管理",
        width: 1200,
        height: 630,
        alt: "学習ユニット一覧",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "学習ユニット一覧 | Learning Journal",
    description:
      "様々なユーザーの学習ユニット一覧です。学びのアイデアを探したり、自分の学習を記録・共有しましょう。",
    images: [
      "/api/og?title=学習ユニット一覧&username=Learning Journal&tags=学習記録,振り返り,学習管理",
    ],
  },
};
