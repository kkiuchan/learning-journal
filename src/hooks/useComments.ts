import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { CommentDTO } from "@/types/comment";
import useSWR from "swr";

interface UseCommentsProps {
  unitId: string;
  page: number;
  limit: number;
}

interface CommentResponse {
  data: CommentDTO[];
  pagination: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export function useComments({ unitId, page, limit }: UseCommentsProps) {
  const { session } = useAuthStore();
  const accessToken = session?.access_token;
  const fetcher = (url: string) => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(url, { headers }).then((res) => res.json());
  };
  const { data, error, isLoading, mutate } = useSWR<CommentResponse>(
    accessToken
      ? `/api/units/${unitId}/comments?page=${page}&limit=${limit}`
      : null,
    fetcher
  );

  const optimisticUpdate = async (
    type: "create" | "update" | "delete",
    optimisticData?: Partial<CommentDTO>,
    commentId?: number
  ) => {
    if (!data) return;

    // 現在のコメントデータのコピーを作成
    const currentComments = [...data.data];

    if (type === "create" && optimisticData) {
      // 新しいコメントを追加
      mutate(
        {
          ...data,
          data: [optimisticData as CommentDTO, ...currentComments],
        },
        false
      );
    } else if (type === "update" && optimisticData && commentId) {
      // コメントを更新
      const updatedComments = currentComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              ...optimisticData,
              user: comment.user, // ユーザー情報を保持
            }
          : comment
      );
      mutate(
        {
          ...data,
          data: updatedComments,
        },
        false
      );
    } else if (type === "delete" && commentId) {
      // コメントを削除
      const filteredComments = currentComments.filter(
        (comment) => comment.id !== commentId
      );
      mutate(
        {
          ...data,
          data: filteredComments,
        },
        false
      );
    }
  };

  return {
    comments: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    optimisticUpdate,
  };
}
