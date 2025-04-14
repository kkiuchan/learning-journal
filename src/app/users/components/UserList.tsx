"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUsers } from "@/hooks/useUsers";
import { ApiUser as User } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import UserAvatar from "../[id]/components/UserAvatar";
export function UserList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // クエリパラメータから値を取得
  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  // SWRを使用してユーザーを取得
  const { users, isLoading, error, pagination } = useUsers({
    page,
    searchQuery,
    limit,
  });

  // 検索条件を更新する関数
  const updateSearchParams = useCallback(
    (newQuery?: string, newPage?: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newQuery !== undefined) {
        if (newQuery) {
          params.set("q", newQuery);
        } else {
          params.delete("q");
        }
      }

      if (newPage !== undefined) {
        if (newPage > 1) {
          params.set("page", newPage.toString());
        } else {
          params.delete("page");
        }
      }

      router.push(`/users?${params.toString()}`);
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

  // 有効な画像URLかどうかをチェックする関数
  const isValidImageUrl = (url: string | null): boolean => {
    if (!url) return false;
    const allowedDomains = [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "localhost",
      window.location.hostname,
      "supabase.co",
    ];
    try {
      const urlObj = new URL(url);
      return allowedDomains.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/15 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        ユーザーが見つかりませんでした
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user: User) => (
          <Link key={user.id} href={`/users/${user.id}`}>
            <Card className="p-4 hover:bg-accent/50">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    imageUrl={isValidImageUrl(user.image) ? user.image : null}
                    userName={user.name}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-semibold">{user.name || "名前なし"}</h3>
                    <p className="text-sm text-muted-foreground">
                      ユニット数: {user._count?.units || 0} | 学習ログ数:{" "}
                      {user._count?.logs || 0}
                    </p>
                  </div>
                </div>
                {user.selfIntroduction && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {user.selfIntroduction}
                  </p>
                )}
                {user.skills && user.skills.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      スキル
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.skills.map((skill) => (
                        <Badge
                          key={skill.id}
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {user.interests && user.interests.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      興味・関心
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.interests.map((interest) => (
                        <Badge
                          key={interest.id}
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          {interest.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => updateSearchParams(undefined, Math.max(1, page - 1))}
            disabled={page === 1}
          >
            前へ
          </Button>
          <span className="py-2 px-4">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              updateSearchParams(
                undefined,
                Math.min(pagination.totalPages, page + 1)
              )
            }
            disabled={page === pagination.totalPages}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
