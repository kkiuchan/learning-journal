// src/hooks/useUsers.ts
import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { User } from "@prisma/client";
import useSWR from "swr";

interface UseUsersOptions {
  page: number;
  searchQuery: string;
  limit: number;
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

export function useUsers(options: UseUsersOptions) {
  const { page, searchQuery, limit } = options;
  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  const searchQueryEncoded = encodeURIComponent(searchQuery.trim() || "*");

  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => res.json());

  const { data, error, isLoading } = useSWR<SearchResponse>(
    accessToken
      ? [
          `/api/users/search?query=${searchQueryEncoded}&page=${page}&limit=${limit}`,
          accessToken,
        ]
      : null,
    fetcher
  );

  return {
    users: data?.data.users ?? [],
    pagination: data?.data.pagination,
    isLoading,
    error: error ? "ユーザー検索中にエラーが発生しました" : null,
  };
}
