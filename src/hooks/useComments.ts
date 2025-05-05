import { Comment } from "@/types";
import useSWR from "swr";

interface UseCommentsProps {
  unitId: string;
  page: number;
  limit: number;
}

interface CommentResponse {
  data: Comment[];
  pagination: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || "コメント一覧の取得中にエラーが発生しました"
    );
  }
  return response.json();
};

export function useComments({ unitId, page, limit }: UseCommentsProps) {
  const { data, error, isLoading, mutate } = useSWR<CommentResponse>(
    `/api/units/${unitId}/comments?page=${page}&limit=${limit}`,
    fetcher
  );

  const optimisticUpdate = async (
    type: "create" | "update" | "delete",
    optimisticData?: Partial<Comment>,
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
          data: [optimisticData as Comment, ...currentComments],
        },
        false
      );
    } else if (type === "update" && optimisticData && commentId) {
      // コメントを更新
      const updatedComments = currentComments.map((comment) =>
        comment.id === commentId ? { ...comment, ...optimisticData } : comment
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
