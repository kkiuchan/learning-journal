"use client";

import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUnitLike } from "@/hooks/useUnitLike";
import { useUnits } from "@/hooks/useUnits";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { Session } from "@supabase/supabase-js";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { UnitCard } from "./UnitCard";

interface UnitsListWithSearchProps {
  userId?: string;
}

export function UnitsListWithSearch({ userId }: UnitsListWithSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session: supabaseSession } = useAuthStore();

  // useTransition for search performance
  const [isPending, startTransition] = useTransition();

  // Supabaseセッションをそのまま利用
  const session: Session | null = supabaseSession;

  // 検索入力の状態を管理
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [filteredSearchQuery, setFilteredSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const { isComposing, onCompositionStart, onCompositionEnd } =
    useCompositionInput();

  // クエリパラメータから値を取得
  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const userIdFilter = searchParams.get("userId") || undefined;
  const page = parseInt(searchParams.get("page") || "1");

  // プロフィール画面での使用の場合はuserIdを優先、そうでなければクエリパラメータのuserIdFilterを使用
  const effectiveUserId = userId || userIdFilter;

  // SWRを使用してユニット（ログ含む）を取得
  const { units, isLoading, mutate, totalPages, currentPage } = useUnits({
    page,
    searchQuery: filteredSearchQuery,
    statusFilter,
    userId: effectiveUserId,
  });

  // いいね機能のフック
  const { handleLike: handleUnitLike } = useUnitLike(
    {
      onSuccess: (wasLiked) => {
        // 楽観的更新のための処理は既にuseUnitsで処理済み
      },
    },
    session
  );

  const debouncedSearchInput = useDebouncedValue(searchInput, 500);

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

  // 検索ハンドラー（useTransition使用）
  const handleSearch = useCallback((newQuery: string) => {
    // 入力フィールドは即座に更新
    setSearchInput(newQuery);

    // 重い検索処理は遅延実行
    startTransition(() => {
      setFilteredSearchQuery(newQuery);
    });
  }, []);

  // 検索条件の更新
  useEffect(() => {
    if (!isComposing && debouncedSearchInput !== searchQuery) {
      updateSearchParams(debouncedSearchInput);
    }
  }, [isComposing, debouncedSearchInput, searchQuery, updateSearchParams]);

  // いいねハンドラー
  const handleLike = async (unitId: number) => {
    const targetUnit = units.find((unit) => unit.id === unitId);
    if (!targetUnit) return;

    // 楽観的更新
    const updatedUnits = units.map((unit) => {
      if (unit.id === unitId) {
        return {
          ...unit,
          isLiked: !unit.isLiked,
          _count: {
            logs: unit._count?.logs || 0,
            comments: unit._count?.comments || 0,
            unitLikes: (unit._count?.unitLikes || 0) + (unit.isLiked ? -1 : 1),
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
          pagination: { totalPages, currentPage },
        },
      },
      false
    );

    // 共通フックを使用
    await handleUnitLike(unitId, targetUnit.isLiked, mutate);
  };

  return (
    <div className="space-y-6">
      {/* プロフィール画面での使用の場合は検索・フィルタ機能を非表示 */}
      {!userId && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 検索バー */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="ユニット名・内容・学習ログから検索..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              className="pl-10 pr-4"
            />

            {/* ローディングインジケーター */}
            {isPending && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* フィルター */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="w-full sm:w-48">
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

            {session && (
              <div className="w-full sm:w-48">
                <Select
                  value={userIdFilter === session.user?.id ? "mine" : "all"}
                  onValueChange={(value) => {
                    const newUserId =
                      value === "mine" ? session.user?.id : undefined;
                    updateSearchParams(undefined, undefined, 1); // Reset to page 1
                    router.push(
                      `/units?${new URLSearchParams({
                        ...(searchQuery && { q: searchQuery }),
                        ...(statusFilter !== "all" && { status: statusFilter }),
                        ...(newUserId && { userId: newUserId }),
                      }).toString()}`
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="作成者で絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのユーザー</SelectItem>
                    <SelectItem value="mine">自分のユニットのみ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 検索結果表示 */}
      <div
        className={`transition-all duration-200 ${
          isPending ? "opacity-60" : "opacity-100"
        }`}
      >
        {isLoading ? (
          <Loading text="検索中..." className="min-h-[200px]" />
        ) : units.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? (
              <div>
                <p className="text-lg mb-2">
                  「{searchQuery}」の検索結果が見つかりませんでした
                </p>
                <p className="text-sm">
                  検索キーワードを変更してお試しください
                </p>
              </div>
            ) : (
              "ユニットが見つかりませんでした"
            )}
          </div>
        ) : (
          <>
            {/* 検索結果サマリー */}
            {searchQuery && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">「{searchQuery}」</span>
                  の検索結果：
                  <span className="font-semibold ml-1">{units.length}件</span>
                  のユニットが見つかりました
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  onLike={handleLike}
                  searchQuery={searchQuery} // 検索キーワードをハイライト用に渡す
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() =>
              updateSearchParams(undefined, undefined, currentPage - 1)
            }
            disabled={currentPage === 1 || isPending}
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
            disabled={currentPage === totalPages || isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
