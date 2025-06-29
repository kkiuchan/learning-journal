// ユニットのステータス（英語のみ）
export type UnitStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

// ユニットの表示フラグ
export type UnitDisplayFlag = boolean;

// 共通の型定義
export interface UserDTO {
  id: string;
  name: string | null;
  image: string | null;
}

export interface TagDTO {
  id: number;
  name: string;
}

export interface UnitCountDTO {
  logs: number;
  unitLikes: number;
  comments: number;
  totalLearningTime?: number;
}

// ドメインモデル（Prismaの型を拡張）
export interface UnitModel {
  id: number;
  userId: string;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  achievementLevel: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: UnitStatus;
  displayFlag: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTO（APIレスポンス用）
export interface UnitDTO
  extends Omit<UnitModel, "startDate" | "endDate" | "createdAt" | "updatedAt"> {
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserDTO;
  tags: TagDTO[];
  _count: UnitCountDTO;
  isLiked: boolean;
}

// フォーム型
export interface UnitFormDTO {
  title: string;
  learningGoal?: string;
  preLearningState?: string;
  reflection?: string;
  nextAction?: string;
  startDate?: Date;
  endDate?: Date;
  status?: UnitStatus;
  tags?: string[];
  displayFlag?: boolean;
}

// 型変換ユーティリティ
export const convertUnitModelToDTO = (
  model: UnitModel & {
    user: UserDTO;
    tags: { tag: TagDTO }[];
    _count: UnitCountDTO;
    isLiked: boolean;
  }
): UnitDTO => {
  return {
    id: model.id,
    userId: model.userId,
    title: model.title,
    learningGoal: model.learningGoal,
    preLearningState: model.preLearningState,
    reflection: model.reflection,
    nextAction: model.nextAction,
    achievementLevel: model.achievementLevel,
    startDate: model.startDate?.toISOString() || null,
    endDate: model.endDate?.toISOString() || null,
    status: model.status,
    displayFlag: model.displayFlag,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    user: model.user,
    tags: model.tags.map(({ tag }) => tag),
    _count: model._count,
    isLiked: model.isLiked,
  };
};

export const convertDTOToUnitModel = (
  dto: UnitDTO
): Omit<UnitModel, "user" | "updatedAt"> => {
  return {
    id: dto.id,
    userId: dto.userId,
    title: dto.title,
    learningGoal: dto.learningGoal,
    preLearningState: dto.preLearningState,
    reflection: dto.reflection,
    nextAction: dto.nextAction,
    achievementLevel: dto.achievementLevel,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    status: dto.status,
    displayFlag: dto.displayFlag,
    createdAt: new Date(dto.createdAt),
  };
};

// 作成・更新用の型
export interface CreateUnitDTO
  extends Omit<UnitFormDTO, "startDate" | "endDate"> {
  startDate?: string;
  endDate?: string;
}

export interface UpdateUnitDTO extends Partial<CreateUnitDTO> {
  achievementLevel?: number;
}

// Zodバリデーションスキーマ
import { z } from "zod";

// 基本スキーマ（refineなし）
const baseUnitSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  learningGoal: z
    .string()
    .max(1000, "学習目標は1000文字以内で入力してください")
    .optional(),
  preLearningState: z
    .string()
    .max(1000, "事前学習状態は1000文字以内で入力してください")
    .optional(),
  reflection: z
    .string()
    .max(2000, "振り返りは2000文字以内で入力してください")
    .optional(),
  nextAction: z
    .string()
    .max(1000, "次のアクションは1000文字以内で入力してください")
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "開始日の形式が正しくありません")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "終了日の形式が正しくありません")
    .optional(),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED"], {
      errorMap: () => ({ message: "ステータスが無効です" }),
    })
    .optional(),
  displayFlag: z.boolean().optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "タグは1文字以上で入力してください")
        .max(50, "タグは50文字以内で入力してください")
    )
    .max(10, "タグは10個まで設定できます")
    .optional(),
});

// 作成用スキーマ（日付バリデーション付き）
export const unitCreateSchema = baseUnitSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: "終了日は開始日より後の日付を設定してください",
    path: ["endDate"],
  }
);

// 更新用スキーマ（全フィールドオプショナル + 達成度）
export const unitUpdateSchema = baseUnitSchema
  .partial()
  .extend({
    achievementLevel: z
      .number()
      .min(0, "達成度は0以上で入力してください")
      .max(100, "達成度は100以下で入力してください")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "終了日は開始日より後の日付を設定してください",
      path: ["endDate"],
    }
  );

export type UnitCreateRequest = z.infer<typeof unitCreateSchema>;
export type UnitUpdateRequest = z.infer<typeof unitUpdateSchema>;
