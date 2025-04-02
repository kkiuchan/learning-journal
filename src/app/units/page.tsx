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
import { Unit } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function UnitsPage() {
  const { data: session } = useSession();
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnits = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { query: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const renderParams = params.toString();

      const response = await fetch(`/api/units?${renderParams}`);
      if (!response.ok) {
        throw new Error("ユニットの取得に失敗しました");
      }
      const data = await response.json();
      console.log("Fetched units:", data.data.units);
      setUnits(data.data.units);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error) {
      console.error("エラーが発生しました:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleDelete = async (id: number) => {
    if (!confirm("このユニットを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUnits();
      } else {
        const data = await response.json();
        console.error("ユニットの削除に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleLike = async (unitId: number) => {
    try {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;

      const method = unit.isLiked ? "DELETE" : "POST";
      console.log(`Current unit state:`, unit);
      console.log(`Sending ${method} request to /api/units/${unitId}/like`);

      const response = await fetch(`/api/units/${unitId}/like`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const updatedUnit = await response.json();
        console.log("Response from like API:", updatedUnit);
        setUnits((prevUnits) =>
          prevUnits.map((u) =>
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
          )
        );
      } else {
        const data = await response.json();
        console.error("いいねの処理に失敗しました:", data.error);
        alert(data.error || "いいねの処理に失敗しました");
      }
    } catch (error) {
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
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="PLANNED">未着手</SelectItem>
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
            <Card key={unit.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <Link href={`/units/${unit.id}`} className="hover:underline">
                    {unit.title}
                  </Link>
                  <Badge
                    variant={
                      unit.status === "COMPLETED" ? "default" : "secondary"
                    }
                  >
                    {unit.status === "PLANNED" && "未着手"}
                    {unit.status === "IN_PROGRESS" && "進行中"}
                    {unit.status === "COMPLETED" && "完了"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unit.learningGoal && (
                    <p className="text-sm text-gray-600">{unit.learningGoal}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {unit.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>
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
                        <span>いいね: {unit._count.unitLikes}</span>
                      </button>
                      <span>コメント: {unit._count.comments}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {session?.user?.id === unit.userId && (
                      <>
                        <Link href={`/units/${unit.id}/edit`}>
                          <Button variant="outline" size="sm">
                            編集
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(unit.id)}
                        >
                          削除
                        </Button>
                      </>
                    )}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            前へ
          </Button>
          <span className="py-2 px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
