import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { LogDTO } from "@/types/log";
import useSWR from "swr";

export function useLogs(unitId: string) {
  const { session } = useAuthStore();
  const accessToken = session?.access_token;
  const fetcher = (url: string) => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(url, { headers }).then((res) => res.json());
  };
  const { data, error, mutate } = useSWR<{ data: LogDTO[] }>(
    accessToken ? `/api/units/${unitId}/logs` : null,
    fetcher
  );

  return {
    logs: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
