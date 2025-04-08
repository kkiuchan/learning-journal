import { Unit } from "@/types";
import useSWR from "swr";

interface UseUnitsOptions {
  page?: number;
  searchQuery?: string;
  statusFilter?: string;
}

interface UnitsResponse {
  data: {
    units: Unit[];
    pagination: {
      totalPages: number;
      currentPage: number;
    };
  };
}

export function useUnits(options: UseUnitsOptions = {}) {
  const { page = 1, searchQuery = "", statusFilter = "all" } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: "10",
    ...(searchQuery && { query: searchQuery }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const { data, error, isLoading, mutate } = useSWR<UnitsResponse>(
    `/api/units?${params.toString()}`,
    undefined
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
