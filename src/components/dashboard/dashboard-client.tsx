"use client";

import { ActiveUnits } from "@/components/dashboard/active-units";
import { DashboardHeader } from "@/components/dashboard/header";
import { LearningProgress } from "@/components/dashboard/learning-progress";
import { RecentLogs } from "@/components/dashboard/recent-logs";
import { DashboardStats } from "@/components/dashboard/stats";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { Loading } from "@/components/ui/loading";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface DashboardClientProps {
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  trialEnd: string | null;
}

export function DashboardClient({
  subscriptionStatus,
  subscriptionEnd,
  trialEnd,
}: DashboardClientProps) {
  const { session, loading: authLoading } = useAuthStore();
  const { data, isLoading, error } = useDashboard();
  const router = useRouter();

  // 認証状態をチェック
  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/auth/supabase-login");
    }
  }, [authLoading, session, router]);

  // 認証チェック中
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  // 未認証の場合
  if (!session) {
    return null; // useEffectでリダイレクトされる
  }

  // データ読み込み中
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            エラーが発生しました
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">
              ダッシュボードの読み込み中にエラーが発生しました。
            </p>
            <pre className="mt-2 text-sm text-red-600 overflow-auto">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // データが存在しない場合
  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />
        <div className="p-8">
          <p className="text-muted-foreground">
            ダッシュボードデータを読み込めませんでした。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader />

      {/* トライアルバナー */}
      <TrialBanner
        subscriptionStatus={subscriptionStatus}
        subscriptionEnd={subscriptionEnd}
        trialEnd={trialEnd}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <DashboardStats data={data.stats} />
        <LearningProgress data={data.progressData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveUnits data={data.activeUnits} />
        <RecentLogs data={data.recentLogs} />
      </div>
    </div>
  );
}
