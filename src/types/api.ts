import {
  PaginatedResponse as BasePaginatedResponse,
  User as BaseUser,
  Comment,
  Log,
  Unit,
} from "./index";

// 共通のレスポンス型
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// 共通のエラーレスポンス型
export interface ApiError {
  error: string;
  status: number;
}

// 認証関連の型定義
export interface AuthResponse {
  user: BaseUser;
  session: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface LinkAccountRequest {
  email: string;
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SetPasswordRequest {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UnlinkAccountRequest {
  provider: string;
}

export interface CheckPasswordResponse {
  hasPassword: boolean;
}

// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  primaryAuthMethod: string;
}

export interface UpdateUserRequest {
  name?: string;
  image?: string;
}

// ユーザー関連の型定義
export interface PublicUser {
  id: string;
  name: string | null;
  image: string | null;
  topImage: string | null;
  age: number | null;
  ageVisible: boolean;
  createdAt: Date;
  skills: {
    id: number;
    name: string;
  }[];
  interests: {
    id: number;
    name: string;
  }[];
  _count: {
    units: number;
  };
  recentUnits: UnitSummary[];
}

export interface UserSearchResponse {
  users: PublicUser[];
  total: number;
}

export interface UserSearchParams {
  query?: string;
  page?: number;
  limit?: number;
}

// Unit関連の型定義を追加
export interface UnitSummary {
  id: number;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  displayFlag: boolean;
  likesCount: number;
  isLiked: boolean;
  createdAt: Date;
  tags: {
    tag: {
      id: number;
      name: string;
    };
  }[];
  _count: {
    logs: number;
    comments: number;
  };
  logs: {
    id: number;
    title: string;
    learningTime: number | null;
    note: string | null;
    logDate: Date;
    tags: {
      tag: {
        id: number;
        name: string;
      };
    }[];
  }[];
  totalLearningTime: number;
}

// ページネーション用の型定義
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

// PublicUserのレスポンス型を修正
export interface PublicUserResponse {
  user: Omit<PublicUser, "recentUnits">;
  units: PaginatedResponse<UnitSummary>;
}

// ユニット検索レスポンスの型
export type UnitSearchResponse = BasePaginatedResponse<Unit>;

// ログ検索レスポンスの型
export type LogSearchResponse = BasePaginatedResponse<Log>;

// コメント検索レスポンスの型
export type CommentSearchResponse = BasePaginatedResponse<Comment>;

// APIエンドポイントの型
export interface ApiEndpoints {
  auth: {
    signup: string;
    signin: string;
    signout: string;
    refresh: string;
  };
  users: {
    me: string;
    search: string;
    profile: (userId: string) => string;
  };
  units: {
    create: string;
    update: (unitId: number) => string;
    delete: (unitId: number) => string;
    search: string;
    detail: (unitId: number) => string;
  };
  logs: {
    create: string;
    update: (logId: number) => string;
    delete: (logId: number) => string;
    search: string;
    detail: (logId: number) => string;
  };
  comments: {
    create: string;
    update: (commentId: number) => string;
    delete: (commentId: number) => string;
    search: string;
  };
}

// APIエンドポイントの定義
export const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    signup: "/api/auth/signup",
    signin: "/api/auth/signin",
    signout: "/api/auth/signout",
    refresh: "/api/auth/refresh",
  },
  users: {
    me: "/api/users/me",
    search: "/api/users/search",
    profile: (userId: string) => `/api/users/${userId}/profile`,
  },
  units: {
    create: "/api/units",
    update: (unitId: number) => `/api/units/${unitId}`,
    delete: (unitId: number) => `/api/units/${unitId}`,
    search: "/api/units/search",
    detail: (unitId: number) => `/api/units/${unitId}`,
  },
  logs: {
    create: "/api/logs",
    update: (logId: number) => `/api/logs/${logId}`,
    delete: (logId: number) => `/api/logs/${logId}`,
    search: "/api/logs/search",
    detail: (logId: number) => `/api/logs/${logId}`,
  },
  comments: {
    create: "/api/comments",
    update: (commentId: number) => `/api/comments/${commentId}`,
    delete: (commentId: number) => `/api/comments/${commentId}`,
    search: "/api/comments/search",
  },
};
