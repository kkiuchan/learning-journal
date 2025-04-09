import { authConfig } from "@/auth.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UnitStatus } from "@/types/unit";
import { translateUnitStatus } from "@/utils/i18n";
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
            <h1 className="text-2xl font-bold mb-2">
              {user.name || "名前未設定"}
            </h1>
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
                    <Badge key={skill.id} variant="secondary">
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
                    <Badge key={interest.id} variant="outline">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.units.data.map((unit) => (
            <Link href={`/units/${unit.id}`} key={unit.id}>
              <Card className="p-4 hover:bg-accent transition-colors">
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-2">{unit.title}</h3>

                  {/* 学習状況 */}
                  <div className="mb-2">
                    <Badge variant="outline">
                      {translateUnitStatus(unit.status)}
                    </Badge>
                  </div>

                  {/* 学習期間 */}
                  {(unit.startDate || unit.endDate) && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {unit.startDate &&
                        `開始: ${new Date(
                          unit.startDate
                        ).toLocaleDateString()}`}
                      {unit.startDate && unit.endDate && " 〜 "}
                      {unit.endDate &&
                        `終了: ${new Date(unit.endDate).toLocaleDateString()}`}
                    </p>
                  )}

                  {/* タグ */}
                  {unit.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {unit.tags.map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 統計情報 */}
                  <div className="mt-auto pt-2 text-sm text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>
                        総学習時間: {Math.floor(unit.totalLearningTime / 60)}
                        時間
                        {unit.totalLearningTime % 60}分
                      </span>
                      <span>いいね: {unit.likesCount}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>ログ: {unit._count.logs}件</span>
                      <span>コメント: {unit._count.comments}件</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* ページネーション情報 */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          全{data.units.pagination.total}件中 {data.units.pagination.page}
          ページ目を表示 （1ページあたり{data.units.pagination.perPage}件）
        </div>
      </div>
    </div>
  );
}
