import { Unit as BaseUnit } from "./index";

// ユニットの型は index.ts から import して使用
export type { BaseUnit };

// ユニットのステータス（英語のみ）
export type UnitStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

// ユニットの表示フラグ
export type UnitDisplayFlag = boolean;

// ユニットの基本型
export interface BaseUnit {
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

// データベースモデル用のUnit型
export type DbUnit = BaseUnit & {
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
export interface ApiUnit
  extends Omit<BaseUnit, "startDate" | "endDate" | "createdAt" | "updatedAt"> {
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  tags: {
    tag: {
      id: number;
      name: string;
    };
  }[];
  _count: {
    logs: number;
    unitLikes: number;
    comments: number;
  };
  isLiked: boolean;
  totalLearningTime?: number;
}

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
    updatedAt: dbUnit.updatedAt.toISOString(),
    user: dbUnit.user,
    tags: dbUnit.tags.map((tag) => ({ tag })),
    _count: {
      logs: dbUnit._count.logs,
      unitLikes: dbUnit._count.unitLikes,
      comments: dbUnit._count.comments,
    },
    isLiked: dbUnit.isLiked,
    totalLearningTime: dbUnit._count.totalLearningTime,
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
    user: apiUnit.user,
    tags: apiUnit.tags.map((tag) => tag.tag),
    _count: {
      logs: apiUnit._count.logs,
      unitLikes: apiUnit._count.unitLikes,
      comments: apiUnit._count.comments,
      totalLearningTime: apiUnit.totalLearningTime,
    },
    isLiked: apiUnit.isLiked,
  };
};

export interface Unit {
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
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  unitTags: {
    tag: {
      id: number;
      name: string;
    };
  }[];
  _count: {
    logs: number;
    unitLikes: number;
    comments: number;
  };
  isLiked: boolean;
}

export interface CreateUnitInput {
  title: string;
  learningGoal?: string;
  preLearningState?: string;
  reflection?: string;
  nextAction?: string;
  startDate?: string;
  endDate?: string;
  status?: UnitStatus;
  tags?: string[];
  displayFlag?: boolean;
}

export interface UpdateUnitInput extends Partial<CreateUnitInput> {
  achievementLevel?: number;
}
