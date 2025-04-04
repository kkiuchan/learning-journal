import { Unit as BaseUnit } from "./index";

// ユニットの型は index.ts から import して使用
export type { BaseUnit };

// ユニットのステータス（英語のみ）
export type UnitStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

// ユニットの表示フラグ
export type UnitDisplayFlag = boolean;

// ユニットの基本型
export type BaseUnit = {
  id: number;
  userId: string;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  status: UnitStatus;
  displayFlag: boolean;
  tags: {
    id: number;
    name: string;
  }[];
  isLiked: boolean;
};

// データベースモデル用のUnit型
export type DbUnit = BaseUnit & {
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    logs: number;
    unitLikes: number;
    comments: number;
    totalLearningTime: number;
  };
};

// APIレスポンス用のUnit型
export type ApiUnit = Omit<BaseUnit, "id"> & {
  id: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  totalLearningTime: number;
  _count: {
    logs: number;
    comments: number;
    unitLikes: number;
  };
};

// フォーム用のUnit型
export type UnitForm = Omit<BaseUnit, "id" | "userId" | "tags" | "isLiked"> & {
  startDate: Date | null;
  endDate: Date | null;
  tags: string[]; // タグ名の配列
};

// 型変換ユーティリティ
export const convertDbUnitToApiUnit = (dbUnit: DbUnit): ApiUnit => {
  return {
    id: dbUnit.id,
    userId: dbUnit.userId,
    title: dbUnit.title,
    learningGoal: dbUnit.learningGoal,
    preLearningState: dbUnit.preLearningState,
    reflection: dbUnit.reflection,
    nextAction: dbUnit.nextAction,
    startDate: dbUnit.startDate?.toISOString() || null,
    endDate: dbUnit.endDate?.toISOString() || null,
    status: dbUnit.status,
    displayFlag: dbUnit.displayFlag,
    createdAt: dbUnit.createdAt.toISOString(),
    totalLearningTime: dbUnit._count.totalLearningTime,
    isLiked: dbUnit.isLiked,
    tags: dbUnit.tags,
    _count: {
      logs: dbUnit._count.logs,
      comments: dbUnit._count.comments,
      unitLikes: dbUnit._count.unitLikes,
    },
  };
};

export const convertApiUnitToDbUnit = (
  apiUnit: ApiUnit
): Omit<DbUnit, "user" | "updatedAt"> => {
  return {
    id: apiUnit.id,
    userId: apiUnit.userId,
    title: apiUnit.title,
    learningGoal: apiUnit.learningGoal,
    preLearningState: apiUnit.preLearningState,
    reflection: apiUnit.reflection,
    nextAction: apiUnit.nextAction,
    startDate: apiUnit.startDate ? new Date(apiUnit.startDate) : null,
    endDate: apiUnit.endDate ? new Date(apiUnit.endDate) : null,
    status: apiUnit.status,
    displayFlag: apiUnit.displayFlag,
    createdAt: new Date(apiUnit.createdAt),
    tags: apiUnit.tags,
    _count: {
      logs: apiUnit._count.logs,
      unitLikes: apiUnit._count.unitLikes,
      comments: apiUnit._count.comments,
      totalLearningTime: apiUnit.totalLearningTime,
    },
    isLiked: apiUnit.isLiked,
  };
};
