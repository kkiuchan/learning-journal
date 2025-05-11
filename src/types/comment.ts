// コメントのドメインモデル
export interface CommentModel {
  id: number;
  comment: string;
  createdAt: Date;
  userId: string;
}

// APIレスポンス用DTO
export interface CommentDTO {
  id: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

// フォーム用型
export interface CommentFormDTO {
  comment: string;
}

// 型変換ユーティリティ
export const convertCommentModelToDTO = (
  model: CommentModel & {
    user: { id: string; name: string | null; image: string | null };
  }
): CommentDTO => {
  return {
    id: model.id,
    comment: model.comment,
    createdAt: model.createdAt.toISOString(),
    user: model.user,
  };
};

export const convertDTOToCommentModel = (
  dto: CommentDTO
): Omit<CommentModel, "user"> => {
  return {
    id: dto.id,
    comment: dto.comment,
    createdAt: new Date(dto.createdAt),
    userId: dto.user.id,
  };
};
