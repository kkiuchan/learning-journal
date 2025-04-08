import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  UNIT: "unit",
  UNIT_LIST: "unit-list",
  USER: "user",
  USER_PROFILE: "user-profile",
  USER_STATS: "user-stats",
  USER_UNITS: "user-units",
  USER_LOGS: "user-logs",
  USER_COMMENTS: "user-comments",
  USER_LIKES: "user-likes",
  USER_INTERESTS: "user-interests",
  USER_SKILLS: "user-skills",
  USER_PROVIDERS: "user-providers",
  LOG: "log",
  LOG_LIST: "log-list",
  COMMENT: "comment",
  COMMENT_LIST: "comment-list",
  TAG: "tag",
  TAG_LIST: "tag-list",
  RESOURCE: "resource",
  RESOURCE_LIST: "resource-list",
} as const;

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
