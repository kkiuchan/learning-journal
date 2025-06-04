import { Loading } from "@/components/ui/loading";
import { MenuProvider } from "@/contexts/MenuContext";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AuthSession } from "@/types/auth";
import { Metadata } from "next";
import { Suspense } from "react";
import UnitDetail from "./components/UnitDetail";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UnitPage({ params }: Props) {
  const currentUser = await getCurrentUserUnified();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // SupabaseユーザーをAuthSession型に変換
  const session: AuthSession | null = currentUser
    ? {
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name || "",
          image: currentUser.image || "",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
      }
    : null;

  return (
    <MenuProvider>
      <Suspense fallback={<Loading text="読み込み中..." />}>
        <UnitDetail id={id} session={session} />
      </Suspense>
    </MenuProvider>
  );
}
