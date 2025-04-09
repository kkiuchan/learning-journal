import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import UnitDetail from "./UnitDetail";

// メタデータの生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { name: true } },
        unitTags: { include: { tag: true } },
      },
    });

    if (!unit) {
      return {
        title: "ユニットが見つかりません",
        description:
          "指定されたユニットは存在しないか、削除された可能性があります。",
        manifest: "/manifest.json",
      };
    }

    const tags = unit.unitTags.map((ut) => ut.tag.name);
    const tagString = tags.length > 0 ? tags.join(", ") : "学習ユニット";
    const learningGoal =
      unit.learningGoal || `${unit.user.name || "ユーザー"}さんの学習ユニット`;
    const userName = unit.user.name || "ユーザー";

    return {
      title: unit.title,
      description: learningGoal,
      keywords: [...tags, "学習記録", "学習管理"],
      manifest: "/manifest.json",
      openGraph: {
        title: `${unit.title} | Learning Journal`,
        description: learningGoal,
        type: "article",
        url: `/units/${id}`,
        images: [
          {
            url: `/api/og?title=${encodeURIComponent(
              unit.title
            )}&username=${encodeURIComponent(
              userName
            )}&tags=${encodeURIComponent(tagString)}`,
            width: 1200,
            height: 630,
            alt: unit.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: unit.title,
        description: learningGoal,
        images: [
          `/api/og?title=${encodeURIComponent(
            unit.title
          )}&username=${encodeURIComponent(userName)}&tags=${encodeURIComponent(
            tagString
          )}`,
        ],
      },
    };
  } catch (error) {
    console.error("メタデータ生成中にエラー:", error);
    return {
      title: "Learning Journal - ユニット詳細",
      description: "学習ユニットの詳細情報",
      manifest: "/manifest.json",
    };
  }
}

// ページコンポーネント
export default async function UnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UnitDetail params={Promise.resolve({ id })} />;
}
