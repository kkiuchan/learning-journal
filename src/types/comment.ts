import { z } from "zod";

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

// コメント作成・更新用のバリデーションスキーマ
export const commentCreateSchema = z.object({
  content: z
    .string()
    .min(1, "コメント内容は必須です")
    .max(1000, "コメントは1000文字以内で入力してください")
    .trim(),
});

export const commentUpdateSchema = commentCreateSchema;

export type CommentCreateRequest = z.infer<typeof commentCreateSchema>;
export type CommentUpdateRequest = z.infer<typeof commentUpdateSchema>;
