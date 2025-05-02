import { UnitStatus } from "@/types/unit";

// ユニットステータスの翻訳
export const unitStatusMessages: Record<UnitStatus, string> = {
  PLANNED: "計画中",
  IN_PROGRESS: "進行中",
  COMPLETED: "完了",
} as const;

// ユニットステータスの翻訳関数
export function translateUnitStatus(status: string): string {
  const translations: Record<string, string> = {
    PLANNED: "計画中",
    IN_PROGRESS: "進行中",
    COMPLETED: "完了",
  };
  return translations[status] || status;
}
