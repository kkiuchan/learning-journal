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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Unit = {
  id: number;
  title: string;
  learningGoal: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  tags: { id: number; name: string }[];
  logsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
};

export default function UnitsPage() {
  const { data: session } = useSession();
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, [page, searchQuery, statusFilter]);

  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/units?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUnits(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error("ユニットの取得に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
            <SelectItem value="not_started">未着手</SelectItem>
            <SelectItem value="in_progress">進行中</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
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
                      unit.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {unit.status === "not_started" && "未着手"}
                    {unit.status === "in_progress" && "進行中"}
                    {unit.status === "completed" && "完了"}
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
                      <span>ログ: {unit.logsCount}</span>
                      <span>いいね: {unit.likesCount}</span>
                      <span>コメント: {unit.commentsCount}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
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
