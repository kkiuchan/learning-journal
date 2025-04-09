import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export async function generateMetadata({
  params,
  parent,
}: {
  params: Promise<{ id: string }>;
  parent: Promise<Metadata>;
}): Promise<Metadata> {
  const { id } = await params;

  // ユニット情報をデータベースから取得
  const unit = await prisma.unit.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      unitTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  // ユニットが存在しない場合はデフォルト値を使用
  if (!unit) {
    return {
      title: "ユニットが見つかりません",
      description:
        "指定されたユニットは存在しないか、削除された可能性があります。",
    };
  }

  // タグの処理
  const tags = unit.unitTags.map((ut) => ut.tag.name);
  const tagString = tags.length > 0 ? tags.join(", ") : "学習ユニット";

  // 親のmetadataを取得
  const parentMetadata = await parent;
  // 配列であることを確認して処理
  const previousImages = parentMetadata.openGraph?.images
    ? Array.isArray(parentMetadata.openGraph.images)
      ? parentMetadata.openGraph.images
      : [parentMetadata.openGraph.images]
    : [];

  // ユーザー名（nullの場合は「ゲスト」にする）
  const userName = unit.user.name || "ゲスト";

  // 学習目標の安全な取得
  const learningGoal =
    unit.learningGoal || `${userName}さんの学習ユニット "${unit.title}"`;

  // メタデータを設定
  return {
    title: unit.title,
    description: learningGoal,
    keywords: [...tags, "学習記録", "学習管理"],
    authors: [{ name: userName }],
    openGraph: {
      title: `${unit.title} | Learning Journal`,
      description: learningGoal,
      type: "article",
      url: `/units/${id}`,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(
            unit.title
          )}&username=${encodeURIComponent(userName)}&tags=${encodeURIComponent(
            tagString
          )}`,
          width: 1200,
          height: 630,
          alt: unit.title,
        },
        ...previousImages,
      ],
      publishedTime: unit.createdAt.toISOString(),
      modifiedTime: unit.updatedAt.toISOString(),
      authors: [userName],
      tags,
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
}
