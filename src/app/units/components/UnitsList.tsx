"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnits } from "@/hooks/useUnits";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { UnitCard } from "./UnitCard";

interface UnitsListProps {
  userId?: string;
}

export function UnitsList({ userId }: UnitsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // 検索入力の状態を管理
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [isComposing, setIsComposing] = useState(false);

  // クエリパラメータから値を取得
  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");

  // SWRを使用してユニットを取得
  const { units, isLoading, mutate, totalPages, currentPage } = useUnits({
    page,
    searchQuery,
    statusFilter,
    userId,
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
        if (newStatus === "all") {
          params.delete("status");
        } else {
          params.set("status", newStatus);
        }
      }

      if (newPage !== undefined) {
        if (newPage === 1) {
          params.delete("page");
        } else {
          params.set("page", newPage.toString());
        }
      }

      router.push(`/units?${params.toString()}`);
    },
    [router, searchParams]
  );

  // 検索ハンドラー
  const handleSearch = useCallback(() => {
    if (!isComposing) {
      updateSearchParams(searchInput);
    }
  }, [isComposing, searchInput, updateSearchParams]);

  // いいねハンドラー
  const handleLike = async (unitId: number) => {
    if (!session?.user) {
      toast.error(
        <div className="flex flex-col gap-2">
          <p>いいねするにはログインが必要です</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login" className="text-sm">
              ログインする
            </Link>
          </Button>
        </div>
      );
      return;
    }

    const targetUnit = units.find((unit) => unit.id === unitId);
    if (!targetUnit) return;

    const isCurrentlyLiked = targetUnit.isLiked;

    // 楽観的更新
    const updatedUnits = units.map((unit) => {
      if (unit.id === unitId) {
        return {
          ...unit,
          isLiked: !isCurrentlyLiked,
          _count: {
            logs: unit._count?.logs || 0,
            comments: unit._count?.comments || 0,
            unitLikes:
              (unit._count?.unitLikes || 0) + (isCurrentlyLiked ? -1 : 1),
          },
        };
      }
      return unit;
    });

    // 楽観的に更新
    await mutate(
      {
        data: {
          units: updatedUnits,
          pagination: {
            totalPages,
            currentPage,
          },
        },
      },
      false
    );

    try {
      const response = await fetch(`/api/units/${unitId}/like`, {
        method: isCurrentlyLiked ? "DELETE" : "POST",
        next: { tags: [`unit-${unitId}`, "unit", "unit-list"] },
      });

      if (!response.ok) {
        // エラーの場合は元の状態に戻す
        await mutate();
        const data = await response.json();
        throw new Error(data.error || "いいねの更新に失敗しました");
      }

      // 成功メッセージを表示
      toast.success(
        isCurrentlyLiked ? "いいねを解除しました" : "いいねしました"
      );
    } catch (error) {
      console.error("いいねの更新中にエラーが発生しました:", error);
      toast.error(
        error instanceof Error ? error.message : "いいねの更新に失敗しました"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="ユニットを検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={(e) => {
              setIsComposing(false);
              setSearchInput((e.target as HTMLInputElement).value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onValueChange={(value) => updateSearchParams(undefined, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ステータスで絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="PLANNED">計画中</SelectItem>
              <SelectItem value="IN_PROGRESS">進行中</SelectItem>
              <SelectItem value="COMPLETED">完了</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Loading text="ユニットを読み込み中..." className="min-h-[200px]" />
      ) : units.length === 0 ? (
        <div className="text-center text-muted-foreground">
          ユニットが見つかりませんでした
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} onLike={handleLike} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() =>
              updateSearchParams(undefined, undefined, currentPage - 1)
            }
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          <div className="flex items-center">
            <span className="px-4 py-2 text-sm font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>
          </div>
          <button
            onClick={() =>
              updateSearchParams(undefined, undefined, currentPage + 1)
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
