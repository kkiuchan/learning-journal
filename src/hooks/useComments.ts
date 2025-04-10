import { Comment } from "@/types";
import useSWR from "swr";

interface CommentResponse {
  data: Comment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseCommentsOptions {
  unitId: string;
  page?: number;
  limit?: number;
}

export function useComments({
  unitId,
  page = 1,
  limit = 10,
}: UseCommentsOptions) {
  const { data, error, isLoading, mutate } = useSWR<CommentResponse>(
    `/api/units/${unitId}/comments?page=${page}&limit=${limit}`,
    null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    }
  );

  const optimisticUpdate = async (
    action: "create" | "update" | "delete",
    commentData?: Partial<Comment>,
    commentId?: number
  ) => {
    if (!data) return;

    let newComments: Comment[];
    switch (action) {
      case "create":
        if (!commentData) return;
        newComments = [commentData as Comment, ...data.data];
        break;
      case "update":
        if (!commentData || !commentId) return;
        newComments = data.data.map((comment) =>
          comment.id === commentId ? { ...comment, ...commentData } : comment
        );
        break;
      case "delete":
        if (!commentId) return;
        newComments = data.data.filter((comment) => comment.id !== commentId);
        break;
      default:
        return;
    }

    await mutate(
      {
        ...data,
        data: newComments,
        pagination: {
          ...data.pagination,
          total:
            action === "create"
              ? data.pagination.total + 1
              : action === "delete"
              ? data.pagination.total - 1
              : data.pagination.total,
        },
      },
      false
    );
  };

  return {
    comments: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
    optimisticUpdate,
  };
}
