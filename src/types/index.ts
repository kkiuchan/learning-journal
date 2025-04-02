// 基本のユーザー情報
export type BaseUser = {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

// データベースのユーザー型（Prismaの型に近い）
export type DbUser = BaseUser & {
  topImage: string | null;
  selfIntroduction: string | null;
  age: number | null;
  ageVisible: boolean;
  primaryAuthMethod: string;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStart?: Date | null;
  subscriptionEnd?: Date | null;
  emailVerified?: Date | null;
  userSkills: {
    tag: {
      id: string;
      name: string;
    };
  }[];
  userInterests: {
    tag: {
      id: string;
      name: string;
    };
  }[];
};

// APIレスポンス用のユーザー型
export type ApiUser = {
  id: string;
  name: string | null;
  image: string | null;
  topImage: string | null;
  selfIntroduction: string | null;
  age: number | null;
  ageVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  skills: {
    id: string;
    name: string;
  }[];
  interests: {
    id: string;
    name: string;
  }[];
  _count?: {
    units: number;
    logs: number;
  };
};

// フロントエンド表示用のユーザー型
export type FrontendUser = Omit<ApiUser, "createdAt" | "updatedAt">;

// 認証用のユーザー型
export type AuthUser = Pick<
  DbUser,
  "id" | "name" | "email" | "image" | "subscriptionStatus" | "primaryAuthMethod"
>;

// 検索結果の型
export type SearchResult = {
  users: FrontendUser[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
};

// APIレスポンスの型
export type ApiResponse<T> =
  | {
      data: T;
      error?: never;
    }
  | {
      data?: never;
      error: string;
    };

// ユニット関連の型
export type Unit = {
  id: number;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  startDate: string | null;
  endDate: string | null;
  displayFlag: boolean;
  createdAt: string;
  totalLearningTime: number;
  isLiked: boolean;
  tags: {
    id: number;
    name: string;
  }[];
  _count: {
    logs: number;
    comments: number;
    unitLikes: number;
  };
  userId: string;
};

// コメントの型
export type Comment = {
  id: number;
  comment: string;
  createdAt: string;
  user: FrontendUser;
};
