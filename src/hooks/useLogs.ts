import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { LogDTO } from "@/types/log";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
    },
  }).then((res) => res.json());

export function useLogs(unitId: string) {
  const { session } = useAuthStore();

  const { data, error, mutate, isLoading } = useSWR<{ data: LogDTO[] }>(
    session ? `/api/units/${unitId}/logs` : null,
    fetcher,
    {
      // キャッシュを完全に無効化
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 0,
      // エラー時の再試行設定
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  return {
    logs: data?.data,
    isLoading,
    error,
    mutate,
  };
}
