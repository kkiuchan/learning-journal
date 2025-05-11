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
