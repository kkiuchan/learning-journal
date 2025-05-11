// --- ドメインモデル（Prismaに近い型） ---
export interface UserModel {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  topImage?: string | null;
  selfIntroduction?: string | null;
  age?: number | null;
  ageVisible?: boolean;
  primaryAuthMethod?: string;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStart?: Date | null;
  subscriptionEnd?: Date | null;
  emailVerified?: Date | null;
}

// --- DTO（APIレスポンス用） ---
export interface UserDTO extends Omit<UserModel, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
  skills?: Array<{ id: string; name: string }>;
  interests?: Array<{ id: string; name: string }>;
  _count?: {
    units: number;
    totalLearningTime?: number;
    logs?: number;
  };
}

// --- フォーム用 ---
export interface UserFormDTO {
  name: string;
  email: string;
  image?: string | null;
  selfIntroduction?: string | null;
  age?: number | null;
  ageVisible?: boolean;
  skills?: string[];
  interests?: string[];
}

// --- 型変換ユーティリティ ---
export const convertUserModelToDTO = (
  model: UserModel & {
    skills?: Array<{ id: string; name: string }>;
    interests?: Array<{ id: string; name: string }>;
    _count?: { units: number; totalLearningTime?: number; logs?: number };
  }
): UserDTO => {
  return {
    ...model,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    skills: model.skills,
    interests: model.interests,
    _count: model._count,
  };
};

export const convertDTOToUserModel = (
  dto: UserDTO
): Omit<UserModel, "skills" | "interests" | "_count"> => {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
};

// --- タグ型 ---
export interface Skill {
  id: string;
  name: string;
}

export interface Interest {
  id: string;
  name: string;
}

// --- Prismaの型に近いDBユーザー型 ---
export type DbUser = UserModel & {
  userSkills: { tag: Skill }[];
  userInterests: { tag: Interest }[];
};

// --- 認証関連で必要な最小限のユーザー情報 ---
export type AuthUser = Pick<
  DbUser,
  "id" | "name" | "email" | "image" | "subscriptionStatus" | "primaryAuthMethod"
>;

// --- フロントエンド表示用 ---
export type FrontendUser = Omit<ApiUser, "createdAt" | "updatedAt">;

// --- 非推奨 or 移行途中のAPI型（今後整理候補） ---
export interface ApiUser {
  id: string;
  name: string | null;
  image: string | null;
  topImage: string | null;
  age: number | null;
  ageVisible: boolean;
  email: string;
  hashedPassword: string | null;
  primaryAuthMethod: string;
  createdAt: Date;
  updatedAt: Date;
  selfIntroduction: string | null;
  skills?: Array<{ id: string; name: string }>;
  interests?: Array<{ id: string; name: string }>;
  _count?: {
    units: number;
    totalLearningTime: number;
    logs: number;
  };
}

// --- 基本のユーザー情報のみ抜き出し ---
export type BaseUser = Pick<
  UserModel,
  "id" | "name" | "image" | "email" | "createdAt" | "updatedAt"
>;
