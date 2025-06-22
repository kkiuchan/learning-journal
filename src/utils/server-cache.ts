import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "./cache";

// ユニットデータの再検証
export const revalidateUnitData = (unitId: string | number) => {
  revalidateTag(CACHE_TAGS.UNIT);
  revalidateTag(CACHE_TAGS.UNIT_LIST);
  revalidateTag(`${CACHE_TAGS.UNIT}-${unitId}`);
  revalidateTag("unit-metadata"); // メタデータキャッシュも無効化
  // ダッシュボードデータも無効化（ユニット変更時）
  revalidateTag(CACHE_TAGS.DASHBOARD);
};

// ユーザーデータの再検証
export const revalidateUserData = (userId: string) => {
  revalidateTag(CACHE_TAGS.USER);
  revalidateTag(CACHE_TAGS.USER_PROFILE);
  revalidateTag(CACHE_TAGS.USER_STATS);
  revalidateTag(`${CACHE_TAGS.USER}-${userId}`);
  // ダッシュボードデータも無効化（ユーザー変更時）
  revalidateTag(CACHE_TAGS.DASHBOARD);
};

// ログデータの再検証
export const revalidateLogData = (unitId: string | number) => {
  revalidateTag(CACHE_TAGS.LOG);
  revalidateTag(CACHE_TAGS.LOG_LIST);
  revalidateTag(`${CACHE_TAGS.LOG}-${unitId}`);
  // ダッシュボードデータも無効化（ログ変更時）
  revalidateTag(CACHE_TAGS.DASHBOARD);
};

// コメントデータの再検証
export const revalidateCommentData = (commentId: string | number) => {
  revalidateTag(CACHE_TAGS.COMMENT);
  revalidateTag(CACHE_TAGS.COMMENT_LIST);
  revalidateTag(`${CACHE_TAGS.COMMENT}-${commentId}`);
};

// ダッシュボードデータの再検証
export const revalidateDashboardData = () => {
  revalidateTag(CACHE_TAGS.DASHBOARD);
};
