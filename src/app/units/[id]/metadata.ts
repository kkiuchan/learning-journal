import { Metadata } from "next";

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/units/${id}`
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
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/units/${id}`;
  const ogImageUrl = `${
    process.env.NEXT_PUBLIC_APP_URL
  }/api/og?title=${encodeURIComponent(title)}&username=${encodeURIComponent(
    unit.user.name || "ユーザー"
  )}&tags=${encodeURIComponent(unit.tags?.join(",") || "")}&t=${Date.now()}`;

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
          url: ogImageUrl,
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
      images: [ogImageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}
