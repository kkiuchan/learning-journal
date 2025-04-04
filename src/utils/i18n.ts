import { UnitStatus } from "@/types/unit";

// ユニットステータスの翻訳
export const unitStatusMessages: Record<UnitStatus, string> = {
  PLANNED: "計画中",
  IN_PROGRESS: "進行中",
  COMPLETED: "完了",
} as const;

// ユニットステータスの翻訳関数
export const translateUnitStatus = (status: UnitStatus): string => {
  return unitStatusMessages[status];
};
