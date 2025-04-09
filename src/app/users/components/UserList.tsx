"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserAvatar from "../[id]/components/UserAvatar";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  topImage: string | null;
  selfIntroduction: string | null;
  skills: Array<{ id: string; name: string }>;
  interests: Array<{ id: string; name: string }>;
  _count: {
    units: number;
    logs: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchResponse {
  data: {
    users: User[];
    total: number;
    pagination: Pagination;
  };
}

export function UserList() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // 有効な画像URLかどうかをチェックする関数
  const isValidImageUrl = (url: string | null): boolean => {
    if (!url) return false;
    // 許可するドメインのリスト
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const query = searchParams.get("q") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const searchQuery = query.trim() || "*";
        const response = await fetch(
          `/api/users/search?query=${encodeURIComponent(
            searchQuery
          )}&page=${page}&limit=${limit}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "ユーザー検索中にエラーが発生しました"
          );
        }

        const data: SearchResponse = await response.json();
        // 画像URLを検証して、無効なURLをnullに置き換える
        const validatedUsers = data.data.users.map((user) => ({
          ...user,
          image: isValidImageUrl(user.image) ? user.image : null,
        }));
        setUsers(validatedUsers);
        setPagination(data.data.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
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
        {users.map((user) => (
          <Link key={user.id} href={`/users/${user.id}`}>
            <Card className="p-4 hover:bg-accent/50">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    imageUrl={user.image}
                    userName={user.name}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-semibold">{user.name || "名前なし"}</h3>
                    <p className="text-sm text-muted-foreground">
                      ユニット: {user._count.units} | 総学習時間:{" "}
                      {user._count.logs}時間
                    </p>
                  </div>
                </div>
                {user.selfIntroduction && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {user.selfIntroduction}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <Badge key={interest.id} variant="outline">
                      {interest.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {pagination && (
        <div className="text-center text-sm text-muted-foreground">
          全{pagination.totalPages}ページ中{pagination.page}ページ目
        </div>
      )}
    </div>
  );
}
