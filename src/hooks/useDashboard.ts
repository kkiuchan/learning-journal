import { useAuthStore } from "@/stores/SupabaseAuthStore";
import useSWR from "swr";

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
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5分ごとに自動更新
      dedupingInterval: 30000, // 30秒間は重複リクエストを防ぐ
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
