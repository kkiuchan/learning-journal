import { UnitsList } from "@/app/units/components/UnitsList";
import { authConfig } from "@/auth.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UnitStatus } from "@/types/unit";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import UserAvatar from "./components/UserAvatar";

interface Skill {
  id: number;
  name: string;
}

interface Interest {
  id: number;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  image: string | null;
  selfIntroduction: string | null;
  age: number | null;
  ageVisible: boolean;
  skills: Skill[];
  interests: Interest[];
  _count: {
    units: number;
  };
}

interface Unit {
  id: number;
  title: string;
  status: UnitStatus;
  startDate: string | null;
  endDate: string | null;
  tags: { tag: { id: number; name: string } }[];
  totalLearningTime: number;
  likesCount: number;
  _count: {
    logs: number;
    comments: number;
  };
}

interface ApiResponse {
  data: {
    user: User;
    units: {
      data: Unit[];
      pagination: {
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
      };
    };
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

// メタデータ生成関数
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/users/${id}`,
      {
        next: { revalidate: 3600 }, // 1時間キャッシュ
      }
    );

    if (!response.ok) {
      return {
        title: "ユーザーが見つかりません",
        description:
          "指定されたユーザーは存在しないか、削除された可能性があります。",
      };
    }

    const { data } = await response.json();
    const { user } = data;

    // 興味・関心のタグを連結
    const interestTags = user.interests.map((i: Interest) => i.name).join(", ");

    // ユーザー名（未設定の場合はデフォルト値）
    const userName = user.name || "Learning Journalユーザー";

    return {
      title: `${userName}のプロフィール`,
      description:
        user.selfIntroduction ||
        `${userName}の学習記録ページです。これまでの学習の軌跡をご覧ください。`,
      openGraph: {
        title: `${userName} | Learning Journal`,
        description: user.selfIntroduction || `${userName}の学習記録`,
        url: `/users/${id}`,
        images: [
          {
            url: `/api/og?title=${encodeURIComponent(
              userName
            )}&username=${encodeURIComponent(
              "プロフィール"
            )}&tags=${encodeURIComponent(interestTags)}`,
            width: 1200,
            height: 630,
            alt: userName,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${userName} | Learning Journal`,
        description: user.selfIntroduction || `${userName}の学習記録`,
        images: [
          `/api/og?title=${encodeURIComponent(
            userName
          )}&username=${encodeURIComponent(
            "プロフィール"
          )}&tags=${encodeURIComponent(interestTags)}`,
        ],
      },
    };
  } catch (error) {
    console.error("メタデータ生成中にエラー:", error);
    return {
      title: "Learning Journal - ユーザープロフィール",
      description: "ユーザーの学習記録ページです。",
    };
  }
}

export default async function UserPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  const currentUserId = session?.user?.id;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/users/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    throw new Error("ユーザー情報の取得に失敗しました");
  }

  const { data } = (await response.json()) as ApiResponse;
  const { user } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <UserAvatar imageUrl={user.image} userName={user.name} size="lg" />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold mb-2">
                {user.name || "名前未設定"}
              </h1>
              {currentUserId === user.id && (
                <Link href="/settings/profile">
                  <Button variant="outline" size="sm">
                    プロフィールを編集
                  </Button>
                </Link>
              )}
            </div>
            {user.selfIntroduction && (
              <p className="text-muted-foreground mb-4">
                {user.selfIntroduction}
              </p>
            )}
            {user.ageVisible && user.age && (
              <p className="text-sm text-muted-foreground mb-4">
                年齢: {user.age}歳
              </p>
            )}
            {user.skills?.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">スキル</h2>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill: Skill) => (
                    <Badge
                      key={skill.id}
                      variant="secondary"
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {user.interests?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">興味・関心</h2>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest: Interest) => (
                    <Badge
                      key={interest.id}
                      variant="outline"
                      className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      {interest.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ユーザーの学習ユニット一覧 */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">学習ユニット一覧</h2>
          <div className="text-xs text-muted-foreground"></div>
          {currentUserId === id && (
            <Link href="/units/new">
              <Button>新規作成</Button>
            </Link>
          )}
        </div>

        {/* UnitsListコンポーネントを使用 */}
        <UnitsList userId={id} />
      </div>
    </div>
  );
}
