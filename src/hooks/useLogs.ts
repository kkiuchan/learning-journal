import { LogDTO } from "@/types/log";
import useSWR from "swr";

export function useLogs(unitId: string) {
  const { data, error, mutate } = useSWR<{ data: LogDTO[] }>(
    `/api/units/${unitId}/logs`
  );

  return {
    logs: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
