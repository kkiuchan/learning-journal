import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";

interface Skill {
  id: string;
  name: string;
}

interface Interest {
  id: string;
  name: string;
}

interface Unit {
  id: number;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  displayFlag: boolean;
  likesCount: number;
  createdAt: string;
  totalLearningTime: number;
  isLiked: boolean;
  tags: Array<{
    tag: {
      id: number;
      name: string;
    };
  }>;
  _count: {
    logs: number;
    comments: number;
  };
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
  params: {
    id: string;
  };
}

export default async function UserPage({ params }: Props) {
  const { id } = await params;

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
          {user.image && (
            <img
              src={user.image}
              alt={user.name || "ユーザー"}
              className="w-24 h-24 rounded-full object-cover"
            />
          )}
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
        <h2 className="text-2xl font-bold mb-4">学習ユニット一覧</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.units.data.map((unit) => (
            <Card key={unit.id} className="p-4">
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-2">{unit.title}</h3>

                {/* 学習状況 */}
                <div className="mb-2">
                  <Badge variant="outline">{unit.status}</Badge>
                </div>

                {/* 学習期間 */}
                {(unit.startDate || unit.endDate) && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {unit.startDate &&
                      `開始: ${new Date(unit.startDate).toLocaleDateString()}`}
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
                      総学習時間: {Math.floor(unit.totalLearningTime / 60)}時間
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
