import { Comment } from "@/types";
import useSWR from "swr";

interface UseCommentsOptions {
  unitId: string;
  page?: number;
  limit?: number;
}

interface CommentResponse {
  data: Comment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useComments({
  unitId,
  page = 1,
  limit = 10,
}: UseCommentsOptions) {
  const { data, error, isLoading, mutate } = useSWR<CommentResponse>(
    `/api/units/${unitId}/comments?page=${page}&limit=${limit}`,
    undefined // fetcherはグローバルに設定されているため省略
  );

  return {
    comments: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}
