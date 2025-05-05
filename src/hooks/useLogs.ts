import { Log } from "@/types";
import useSWR from "swr";

export function useLogs(unitId: string) {
  const { data, error, mutate } = useSWR<{ data: Log[] }>(
    `/api/units/${unitId}/logs`
  );

  return {
    logs: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
