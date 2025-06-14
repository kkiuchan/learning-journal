import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { UnitDTO } from "@/types/unit";
import useSWR from "swr";

interface UseUnitsOptions {
  page?: number;
  searchQuery?: string;
  statusFilter?: string;
  userId?: string;
}

interface UnitsResponse {
  data: {
    units: UnitDTO[];
    pagination: {
      totalPages: number;
      currentPage: number;
    };
  };
}

export function useUnits(options: UseUnitsOptions = {}) {
  const { page = 1, searchQuery = "", statusFilter = "all", userId } = options;
  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: "10",
    ...(searchQuery && { query: searchQuery }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(userId && { userId }),
  });

  const fetcher = (url: string) => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(url, { headers }).then((res) => res.json());
  };

  const { data, error, isLoading, mutate } = useSWR<UnitsResponse>(
    accessToken ? `/api/units?${params.toString()}` : null,
    fetcher
  );

  return {
    units: data?.data.units ?? [],
    totalPages: data?.data.pagination.totalPages ?? 1,
    currentPage: data?.data.pagination.currentPage ?? 1,
    isLoading,
    isError: error,
    mutate,
  };
}
