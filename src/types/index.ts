import { UserDTO } from "./user";

// 検索結果の型
export type SearchResult = {
  users: UserDTO[];
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

// ユニット関連の型はunit.tsで管理するため削除
// import { UnitDTO, UnitModel } from "./unit";
// 必要なら下記のように再エクスポート
// export type { UnitDTO, UnitModel } from "./unit";

// コメント関連の型はcomment.tsで管理するため削除
// import { CommentDTO, CommentModel } from "./comment";
// 必要なら下記のように再エクスポート
// export type { CommentDTO, CommentModel } from "./comment";

// ユーザー関連の型はuser.tsで管理するため削除
// import { UserDTO, UserModel, Skill, Interest, BaseUser, DbUser, ApiUser, FrontendUser, AuthUser } from "./user";
// 必要なら下記のように再エクスポート
// export type { UserDTO, UserModel, Skill, Interest, BaseUser, DbUser, ApiUser, FrontendUser, AuthUser } from "./user";

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

// UserApiResponse型はapi.tsにUserDetailResponseとして移動済み
