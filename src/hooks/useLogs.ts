import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { LogDTO } from "@/types/log";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useLogs(unitId: string) {
  const { session } = useAuthStore();

  const { data, error, mutate, isLoading } = useSWR<{ data: LogDTO[] }>(
    session ? `/api/units/${unitId}/logs` : null,
    fetcher
  );

  return {
    logs: data?.data,
    isLoading,
    error,
    mutate,
  };
}
