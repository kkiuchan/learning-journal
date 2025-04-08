import { Log } from "@/types";
import useSWR from "swr";

export function useLogs(unitId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ data: Log[] }>(
    `/api/units/${unitId}/logs`,
    undefined // fetcherはグローバルに設定されているため省略
  );

  return {
    logs: data?.data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
