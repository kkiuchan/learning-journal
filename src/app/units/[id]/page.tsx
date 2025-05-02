import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import UnitDetail from "./UnitDetail";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = await params.id;
  const numericId = parseInt(id);

  // IDが無効な場合のエラーハンドリング
  if (isNaN(numericId)) {
    return {
      title: "ユニットが見つかりません",
      description: "指定されたユニットは存在しません。",
    };
  }

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: numericId },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!unit) {
      return {
        title: "ユニットが見つかりません",
        description: "指定されたユニットは存在しません。",
      };
    }

    const { title, learningGoal } = unit;
    const userName = unit.user.name || "ユーザー";

    return {
      title: `${title} | Learning Journal`,
      description: learningGoal || "学習ユニットの詳細ページです。",
      openGraph: {
        title: title,
        description: learningGoal || `${userName}さんの学習ユニット`,
        type: "article",
        url: `/units/${id}`,
        images: [
          {
            url: `/api/og?title=${encodeURIComponent(
              title
            )}&description=${encodeURIComponent(learningGoal || "")}`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: learningGoal || `${userName}さんの学習ユニット`,
        images: [
          `/api/og?title=${encodeURIComponent(
            title
          )}&description=${encodeURIComponent(learningGoal || "")}`,
        ],
      },
    };
  } catch (error) {
    console.error("Error fetching unit metadata:", error);
    return {
      title: "エラー",
      description: "ユニット情報の取得中にエラーが発生しました。",
    };
  }
}

// ページコンポーネント
export default async function UnitPage({ params }: Props) {
  const id = await params.id;
  const numericId = parseInt(id);

  if (isNaN(numericId)) {
    notFound();
  }

  return <UnitDetail id={id} />;
}
