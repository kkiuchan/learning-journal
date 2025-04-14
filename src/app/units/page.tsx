"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnits } from "@/hooks/useUnits";
import { translateUnitStatus } from "@/utils/i18n";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // クエリパラメータから値を取得
  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");

  // SWRを使用してユニットを取得
  const { units, isLoading, mutate, totalPages, currentPage } = useUnits({
    page,
    searchQuery,
    statusFilter,
  });

  // 検索条件を更新する関数
  const updateSearchParams = useCallback(
    (newQuery?: string, newStatus?: string, newPage?: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newQuery !== undefined) {
        if (newQuery) {
          params.set("q", newQuery);
        } else {
          params.delete("q");
        }
      }

      if (newStatus !== undefined) {
        if (newStatus !== "all") {
          params.set("status", newStatus);
        } else {
          params.delete("status");
        }
      }

      if (newPage !== undefined) {
        if (newPage > 1) {
          params.set("page", newPage.toString());
        } else {
          params.delete("page");
        }
      }

      router.push(`/units?${params.toString()}`);
    },
    [router, searchParams]
  );

  // 検索クエリの更新（デバウンス処理付き）
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearchParams(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, updateSearchParams]);

  const handleDelete = async (id: number) => {
    if (!confirm("このユニットを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // キャッシュを更新
        mutate();
      } else {
        const data = await response.json();
        console.error("ユニットの削除に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleLike = async (unitId: number) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    // 楽観的更新
    const previousUnits = [...units];
    mutate(
      {
        data: {
          units: units.map((u) =>
            u.id === unitId
              ? {
                  ...u,
                  isLiked: !u.isLiked,
                  _count: {
                    ...u._count,
                    unitLikes: u.isLiked
                      ? u._count.unitLikes - 1
                      : u._count.unitLikes + 1,
                  },
                }
              : u
          ),
          pagination: {
            totalPages,
            currentPage,
          },
        },
      },
      { revalidate: false }
    );

    try {
      const method = !unit.isLiked ? "POST" : "DELETE";
      const response = await fetch(`/api/units/${unitId}/like`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        mutate({
          data: {
            units: previousUnits,
            pagination: {
              totalPages,
              currentPage,
            },
          },
        });
        const data = await response.json();
        console.error("いいねの処理に失敗しました:", data.error);
        alert(data.error || "いいねの処理に失敗しました");
      }
    } catch (error) {
      mutate({
        data: {
          units: previousUnits,
          pagination: {
            totalPages,
            currentPage,
          },
        },
      });
      console.error("いいねの処理に失敗しました:", error);
      alert("いいねの処理に失敗しました");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">学習ユニット一覧</h1>
        <Link href="/units/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => updateSearchParams(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => updateSearchParams(undefined, value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="PLANNED">計画中</SelectItem>
            <SelectItem value="IN_PROGRESS">進行中</SelectItem>
            <SelectItem value="COMPLETED">完了</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div>読み込み中...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <Card key={unit.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <Link
                    href={`/units/${unit.id}`}
                    className="hover:underline line-clamp-2"
                  >
                    {unit.title}
                  </Link>
                  <Badge
                    variant={
                      unit.status === "COMPLETED" ? "default" : "secondary"
                    }
                  >
                    {translateUnitStatus(unit.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {unit.learningGoal && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {unit.learningGoal}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {unit.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="bg-gray-100"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {unit.tags.length > 3 && (
                      <Badge variant="outline" className="bg-gray-100">
                        +{unit.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-auto">
                    <div className="line-clamp-1">
                      {unit.startDate && (
                        <span>
                          開始:{" "}
                          {format(new Date(unit.startDate), "yyyy/MM/dd", {
                            locale: ja,
                          })}
                        </span>
                      )}
                      {unit.endDate && (
                        <span className="ml-2">
                          終了:{" "}
                          {format(new Date(unit.endDate), "yyyy/MM/dd", {
                            locale: ja,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <span>ログ: {unit._count.logs}</span>
                      <button
                        onClick={() => handleLike(unit.id)}
                        className={`flex items-center gap-1 ${
                          unit.isLiked ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        <Heart className={unit.isLiked ? "fill-current" : ""} />
                        <span>{unit._count.unitLikes}</span>
                      </button>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MessageCircle />
                        <span>{unit._count.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() =>
              updateSearchParams(undefined, undefined, Math.max(1, page - 1))
            }
            disabled={page === 1}
          >
            前へ
          </Button>
          <span className="py-2 px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              updateSearchParams(
                undefined,
                undefined,
                Math.min(totalPages, page + 1)
              )
            }
            disabled={page === totalPages}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
