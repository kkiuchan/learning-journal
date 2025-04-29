import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/units/${params.id}`
  );
  const { data: unit } = await response.json();

  if (!unit) {
    return {
      title: "Unit not found",
      description: "指定されたユニットは存在しません",
    };
  }

  const title = unit.title;
  const description = unit.learningGoal || "Learning Journalで学習を記録・共有";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/units/${params.id}`;

  return {
    title: `${title} | Learning Journal`,
    description,
    openGraph: {
      title: `${title} | Learning Journal`,
      description,
      type: "article",
      url,
      siteName: "Learning Journal",
      locale: "ja_JP",
      authors: unit.user.name ? [unit.user.name] : undefined,
      images: [
        {
          url: `/units/${params.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Learning Journal`,
      description,
      creator: unit.user.name || undefined,
      images: [`/units/${params.id}/opengraph-image`],
    },
    alternates: {
      canonical: url,
    },
  };
}
