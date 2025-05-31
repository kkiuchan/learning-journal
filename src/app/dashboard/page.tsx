import { authConfig } from "@/auth.config";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ダッシュボード",
  description: "学習の進捗状況や統計情報を確認できます。",
};

export const revalidate = 0; // キャッシュを無効化

async function getDashboardData(userId: string) {
  const today = new Date();
  today.setHours(today.getHours() + 9); // JSTに調整
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // 総学習時間を取得（今月）
  const monthlyLogs = await prisma.log.findMany({
    where: {
      userId,
      logDate: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
    select: {
      learningTime: true,
    },
  });

  const totalLearningTime = monthlyLogs.reduce(
    (acc, log) => acc + (log.learningTime || 0),
    0
  );

  // 進行中のユニット数を取得
  const activeUnits = await prisma.unit.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
    },
    include: {
      logs: {
        select: {
          learningTime: true,
        },
      },
    },
  });

  const completedUnitsCount = await prisma.unit.count({
    where: {
      userId,
      status: "COMPLETED",
    },
  });

  // 連続学習日数を計算
  const recentLogs = await prisma.log.findMany({
    where: {
      userId,
    },
    select: {
      logDate: true,
    },
    orderBy: {
      logDate: "desc",
    },
  });

  let streakDays = 0;
  today.setHours(0, 0, 0, 0);

  // 今日の日付から1日ずつ遡って連続学習日数をカウント
  let checkDate = new Date(today);
  let hasLogToday = false;

  // 今日の学習ログがあるか確認
  const todayLog = recentLogs.find((log) => {
    const logDate = new Date(log.logDate);
    return logDate.toDateString() === today.toDateString();
  });

  if (!todayLog) {
    // 今日の学習がまだの場合、昨日から確認を開始
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < recentLogs.length; i++) {
    const logDate = new Date(recentLogs[i].logDate);
    logDate.setHours(0, 0, 0, 0);

    if (logDate.toDateString() === checkDate.toDateString()) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (
      (checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24) >
      1
    ) {
      // 1日以上の空きがある場合は連続記録終了
      break;
    }
  }

  // 今日の学習がある場合は+1
  if (todayLog) {
    streakDays++;
  }

  // 最近の学習ログを取得
  const recentLogsWithDetails = await prisma.log.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      title: true,
      logDate: true,
      learningTime: true,
      note: true,
      unit: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      logDate: "desc",
    },
    take: 5,
  });

  // 学習時間の推移データを取得（直近7日間）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(sevenDaysAgo.getHours() + 9); // JSTに調整
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyLogs = await prisma.log.groupBy({
    by: ["logDate"],
    where: {
      userId,
      logDate: {
        gte: sevenDaysAgo,
      },
    },
    _sum: {
      learningTime: true,
    },
  });

  const progressData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() + 9); // JSTに調整
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const log = dailyLogs.find(
      (log) => new Date(log.logDate).toDateString() === date.toDateString()
    );

    return {
      name: `${date.getMonth() + 1}/${date.getDate()}`,
      hours: (log?._sum.learningTime || 0) / 60,
    };
  }).reverse();

  return {
    stats: {
      totalLearningTime: totalLearningTime / 60,
      completedUnitsCount,
      activeUnitsCount: activeUnits.length,
      streakDays,
    },
    activeUnits: activeUnits.map((unit) => ({
      id: unit.id,
      title: unit.title,
      progress: calculateUnitProgress(unit),
      learningGoal: unit.learningGoal,
      achievementLevel: unit.achievementLevel ?? 0,
    })),
    recentLogs: recentLogsWithDetails.map((log) => ({
      title: log.title,
      date: log.logDate.toISOString(),
      duration: log.learningTime,
      content: log.note,
      unitId: log.unit.id,
      unitTitle: log.unit.title,
    })),
    progressData,
  };
}

function calculateUnitProgress(unit: any): number {
  // 目標学習時間（デフォルト: 20時間 = 1200分）
  const targetLearningTime = 1200;

  // 現在までの総学習時間を計算
  const totalLearningTime = unit.logs.reduce(
    (acc: number, log: { learningTime: number | null }) =>
      acc + (log.learningTime || 0),
    0
  );

  // 進捗率を計算（最大100%）
  const progress = Math.min(
    (totalLearningTime / targetLearningTime) * 100,
    100
  );

  return Math.round(progress);
}

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.id);

  // ユーザーのサブスクリプション情報を取得
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionStatus: true,
      subscriptionEnd: true,
      trialEnd: true, // トライアル期間終了日も取得
    },
  });

  // 型変換（Prismaの型をコンポーネントで期待される型に合わせる）
  const formattedData = {
    ...data,
    activeUnits: data.activeUnits.map((unit) => ({
      ...unit,
      id: String(unit.id), // number を string に変換
    })),
    recentLogs: data.recentLogs.map((log) => ({
      ...log,
      unitId: String(log.unitId), // number を string に変換
    })),
  };

  return (
    <DashboardClient
      data={formattedData}
      subscriptionStatus={user?.subscriptionStatus || null}
      subscriptionEnd={user?.subscriptionEnd?.toISOString() || null}
      trialEnd={user?.trialEnd?.toISOString() || null}
    />
  );
}
