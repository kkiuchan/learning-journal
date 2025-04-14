// src/hooks/useUsers.ts
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

  const searchQueryEncoded = encodeURIComponent(searchQuery.trim() || "*");
  const { data, error, isLoading } = useSWR<SearchResponse>(
    `/api/users/search?query=${searchQueryEncoded}&page=${page}&limit=${limit}`,
    undefined
  );

  return {
    users: data?.data.users ?? [],
    pagination: data?.data.pagination,
    isLoading,
    error: error ? "ユーザー検索中にエラーが発生しました" : null,
  };
}
