import { useAuthStore } from "@/stores/SupabaseAuthStore";
import useSWR, { mutate as globalMutate } from "swr";

interface DashboardStats {
  totalLearningTime: number;
  completedUnitsCount: number;
  activeUnitsCount: number;
  streakDays: number;
}

interface ActiveUnit {
  id: string;
  title: string;
  progress: number;
  learningGoal: string | null;
  achievementLevel: number;
}

interface RecentLog {
  title: string;
  date: string;
  duration: number | null;
  content: string | null;
  unitId: string;
  unitTitle: string;
}

interface ProgressData {
  name: string;
  hours: number;
}

interface DashboardData {
  stats: DashboardStats;
  activeUnits: ActiveUnit[];
  recentLogs: RecentLog[];
  progressData: ProgressData[];
}

interface DashboardResponse {
  data: DashboardData;
}

// ダッシュボードキャッシュを手動で更新する関数
export function mutateDashboard() {
  return globalMutate("/api/dashboard");
}

export function useDashboard() {
  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  const fetcher = (url: string) => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(url, { headers }).then((res) => res.json());
  };

  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    accessToken ? "/api/dashboard" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data: data?.data,
    isLoading,
    error,
    mutate,
  };
}
