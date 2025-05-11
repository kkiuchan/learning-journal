import { z } from "zod";

// 共通の型定義
export interface ResourceDTO {
  id: number;
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

export interface LogTagDTO {
  id: number;
  name: string;
}

// ドメインモデル（Prismaの型を拡張）
export interface LogModel {
  id: number;
  unitId: number;
  userId: string;
  title: string;
  learningTime: number;
  note: string;
  logDate: Date;
  createdAt: Date;
  updatedAt: Date;
  effectScore?: number;
  effectType?: "understanding" | "practical" | "application" | "none";
}

// DTO（APIレスポンス用）
export interface LogDTO
  extends Omit<LogModel, "logDate" | "createdAt" | "updatedAt"> {
  logDate: string;
  createdAt: string;
  updatedAt: string;
  tags?: LogTagDTO[];
  resources?: ResourceDTO[];
}

// フォーム型
export interface LogFormDTO {
  title: string;
  learningTime: number;
  note: string;
  logDate: Date;
  effectScore?: number;
  effectType?: "understanding" | "practical" | "application" | "none";
  tags?: string[];
  resources?: Omit<ResourceDTO, "id">[];
}

// 作成・更新用の型
export interface CreateLogDTO extends Omit<LogFormDTO, "logDate"> {
  logDate: string;
}

export interface UpdateLogDTO extends Partial<CreateLogDTO> {}

// バリデーションスキーマ
export const logRequestSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  learningTime: z.number().min(0, "学習時間は0以上である必要があります"),
  note: z.string().min(1, "ノートは必須です"),
  logDate: z.string().min(1, "ログ日は必須です"),
  effectScore: z.number().min(1).max(5).optional(),
  effectType: z
    .enum(["understanding", "practical", "application", "none"])
    .optional(),
  tags: z.array(z.string()).optional(),
  resources: z
    .array(
      z.object({
        id: z.number().optional(),
        resourceType: z.string().nullable(),
        resourceLink: z.string(),
        description: z.string().nullable(),
        fileName: z.string().optional(),
        filePath: z.string().optional(),
      })
    )
    .optional(),
});

// 型変換ユーティリティ
export const convertLogModelToDTO = (
  model: LogModel & {
    logTags?: { tag: LogTagDTO }[];
    resources?: ResourceDTO[];
  }
): LogDTO => {
  return {
    id: model.id,
    unitId: model.unitId,
    userId: model.userId,
    title: model.title,
    learningTime: model.learningTime,
    note: model.note,
    logDate: model.logDate.toISOString(),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    effectScore: model.effectScore,
    effectType: model.effectType,
    tags: model.logTags?.map(({ tag }) => tag),
    resources: model.resources,
  };
};

export const convertDTOToLogModel = (
  dto: LogDTO
): Omit<LogModel, "logTags" | "resources"> => {
  return {
    id: dto.id,
    unitId: dto.unitId,
    userId: dto.userId,
    title: dto.title,
    learningTime: dto.learningTime,
    note: dto.note,
    logDate: new Date(dto.logDate),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    effectScore: dto.effectScore,
    effectType: dto.effectType,
  };
};
