import { Log } from "@/types";
import useSWR from "swr";

export function useLogs(unitId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ data: Log[] }>(
    unitId ? `/api/units/${unitId}/logs` : null,
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        next: { tags: [`unit-${unitId}-logs`] },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "ログの取得中にエラーが発生しました"
        );
      }

      return response.json();
    },
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
      dedupingInterval: 5000,
    }
  );

  return {
    logs: data?.data ?? [],
    isLoading,
    isError:
      error instanceof Error
        ? error.message
        : "ログの取得中にエラーが発生しました",
    mutate,
  };
}
