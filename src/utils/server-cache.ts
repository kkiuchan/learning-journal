import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "./cache";

// ユニットデータの再検証
export const revalidateUnitData = (unitId: string | number) => {
  revalidateTag(CACHE_TAGS.UNIT);
  revalidateTag(CACHE_TAGS.UNIT_LIST);
  revalidateTag(`${CACHE_TAGS.UNIT}-${unitId}`);
};

// ユーザーデータの再検証
export const revalidateUserData = (userId: string) => {
  revalidateTag(CACHE_TAGS.USER);
  revalidateTag(CACHE_TAGS.USER_PROFILE);
  revalidateTag(CACHE_TAGS.USER_STATS);
  revalidateTag(`${CACHE_TAGS.USER}-${userId}`);
};

// ログデータの再検証
export const revalidateLogData = (logId: string | number) => {
  revalidateTag(CACHE_TAGS.LOG);
  revalidateTag(CACHE_TAGS.LOG_LIST);
  revalidateTag(`${CACHE_TAGS.LOG}-${logId}`);
};

// コメントデータの再検証
export const revalidateCommentData = (commentId: string | number) => {
  revalidateTag(CACHE_TAGS.COMMENT);
  revalidateTag(CACHE_TAGS.COMMENT_LIST);
  revalidateTag(`${CACHE_TAGS.COMMENT}-${commentId}`);
};
