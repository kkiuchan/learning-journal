"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
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
    return <Loading text="ユーザーを読み込み中..." className="min-h-[200px]" />;
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
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user: User) => (
          <Link key={user.id} href={`/users/${user.id}`}>
            <Card className="h-full flex flex-col hover:bg-accent/50 transition-colors">
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <UserAvatar
                    imageUrl={isValidImageUrl(user.image) ? user.image : null}
                    userName={user.name}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      {user.name || "名前なし"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      ユニット: {user._count?.units || 0} | ログ:{" "}
                      {user._count?.logs || 0}
                    </p>
                  </div>
                </div>
                {user.selfIntroduction && (
                  <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground">
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
                          className="text-xs bg-primary/10 hover:bg-primary/20"
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
                          variant="secondary"
                          className="text-xs bg-secondary/20 hover:bg-secondary/30"
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
        <div className="flex justify-center items-center gap-2 sm:gap-4 mt-4 sm:mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSearchParams(undefined, Math.max(1, page - 1))}
            disabled={page === 1}
          >
            前へ
          </Button>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
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
