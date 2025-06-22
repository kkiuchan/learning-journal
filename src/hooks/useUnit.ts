import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { UnitDTO } from "@/types/unit";
import useSWR from "swr";

interface UseUnitOptions {
  unitId: string;
}

interface UnitResponse {
  data: UnitDTO;
}

export function useUnit({ unitId }: UseUnitOptions) {
  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  const fetcher = (url: string) => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(url, { headers }).then((res) => res.json());
  };

  const { data, error, isLoading, mutate } = useSWR<UnitResponse>(
    accessToken && unitId ? `/api/units/${unitId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10秒間は重複リクエストを防ぐ
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    unit: data?.data,
    isLoading,
    error,
    mutate,
  };
}
