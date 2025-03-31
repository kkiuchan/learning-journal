// 共通のレスポンス型
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// 共通のエラーレスポンス型
export interface ApiError {
  error: string;
}

// 認証関連の型定義
export interface AuthResponse {
  message: string;
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

// APIエンドポイントの一覧
export const API_ENDPOINTS = {
  auth: {
    checkPassword: "/api/auth/check-password",
    linkAccount: "/api/auth/link-account",
    setPassword: "/api/auth/set-password",
    unlinkAccount: "/api/auth/unlink-account",
  },
  user: {
    me: "/api/users/me",
    update: "/api/users/update",
  },
  users: {
    getById: (id: string) => `/api/users/${id}`,
    search: "/api/users/search",
  },
} as const;
