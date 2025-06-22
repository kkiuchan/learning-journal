import { Loading } from "@/components/ui/loading";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { Session } from "@supabase/supabase-js";
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
    // ✅ Next.jsサーバーサイドキャッシュを活用してAPIルート経由でデータ取得
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/units/${id}`, {
      next: {
        revalidate: 1800, // 30分キャッシュ（メタデータは変更頻度が中程度）
        tags: [`unit-${id}`, "unit", "unit-metadata"],
      },
    });

    if (!response.ok) {
      return {
        title: "ユニットが見つかりません",
        description: "指定されたユニットは存在しません。",
      };
    }

    const { data: unit } = await response.json();

    if (!unit) {
      return {
        title: "ユニットが見つかりません",
        description: "指定されたユニットは存在しません。",
      };
    }

    const { title, learningGoal } = unit;
    const userName = unit.user?.name || "ユーザー";

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

  // SupabaseユーザーをSession型に変換
  const session: Session | null = currentUser
    ? {
        access_token: "dummy-token", // APIアクセスには使用しない
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "dummy-refresh-token",
        user: {
          id: currentUser.id,
          email: currentUser.email || "",
          user_metadata: {
            name: currentUser.name || "",
            avatar_url: currentUser.image || "",
          },
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          created_at: "",
          updated_at: "",
        },
        expires_at: Date.now() + 24 * 60 * 60 * 1000,
      }
    : null;

  return (
    <Suspense fallback={<Loading text="読み込み中..." />}>
      <UnitDetail id={id} session={session} />
    </Suspense>
  );
}
