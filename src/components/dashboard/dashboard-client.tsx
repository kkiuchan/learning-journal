"use client";

import { ActiveUnits } from "@/components/dashboard/active-units";
import { DashboardHeader } from "@/components/dashboard/header";
import { LearningProgress } from "@/components/dashboard/learning-progress";
import { RecentLogs } from "@/components/dashboard/recent-logs";
import { DashboardStats } from "@/components/dashboard/stats";
import { TrialBanner } from "@/components/dashboard/trial-banner";

interface DashboardData {
  stats: {
    totalLearningTime: number;
    completedUnitsCount: number;
    activeUnitsCount: number;
    streakDays: number;
  };
  activeUnits: Array<{
    id: string;
    title: string;
    progress: number;
    learningGoal: string | null;
    achievementLevel: number;
  }>;
  recentLogs: Array<{
    title: string;
    date: string;
    duration: number | null;
    content: string | null;
    unitId: string;
    unitTitle: string;
  }>;
  progressData: Array<{
    name: string;
    hours: number;
  }>;
}

interface DashboardClientProps {
  data: DashboardData;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  trialEnd: string | null;
}

export function DashboardClient({
  data,
  subscriptionStatus,
  subscriptionEnd,
  trialEnd,
}: DashboardClientProps) {
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
