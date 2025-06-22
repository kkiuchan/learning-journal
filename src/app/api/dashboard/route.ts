import { createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// キャッシュの有効期限を5分に設定（リアルタイム性重視）
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserUnified();

    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    const userId = user.id;

    // 学習統計の取得
    const [totalLearningTime, completedUnitsCount, activeUnits, recentLogs] =
      await Promise.all([
        // 総学習時間
        prisma.log.aggregate({
          where: { userId },
          _sum: { learningTime: true },
        }),

        // 完了したユニット数
        prisma.unit.count({
          where: { userId, status: "COMPLETED" },
        }),

        // アクティブなユニット
        prisma.unit.findMany({
          where: {
            userId,
            status: { in: ["PLANNED", "IN_PROGRESS"] },
          },
          include: {
            logs: {
              select: { learningTime: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),

        // 最近のログ
        prisma.log.findMany({
          where: { userId },
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
          orderBy: { logDate: "desc" },
          take: 5,
        }),
      ]);

    // 連続学習日数の計算
    const allLogs = await prisma.log.findMany({
      where: { userId },
      select: { logDate: true },
      orderBy: { logDate: "desc" },
    });

    let streakDays = 0;
    const jstToday = new Date();
    jstToday.setHours(jstToday.getHours() + 9);
    jstToday.setHours(0, 0, 0, 0);

    const uniqueLogDates = new Set(
      allLogs.map((log) => {
        const logDate = new Date(log.logDate);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime();
      })
    );

    let checkDate = new Date(jstToday);
    while (uniqueLogDates.has(checkDate.getTime())) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (!uniqueLogDates.has(jstToday.getTime())) {
      streakDays = 0;
      checkDate = new Date(jstToday);
      checkDate.setDate(checkDate.getDate() - 1);

      while (uniqueLogDates.has(checkDate.getTime())) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 学習時間の推移データ（直近7日間）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(sevenDaysAgo.getHours() + 9);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyLogs = await prisma.log.groupBy({
      by: ["logDate"],
      where: {
        userId,
        logDate: { gte: sevenDaysAgo },
      },
      _sum: { learningTime: true },
    });

    const progressData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() + 9);
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

    const dashboardData = {
      stats: {
        totalLearningTime: (totalLearningTime._sum.learningTime || 0) / 60,
        completedUnitsCount,
        activeUnitsCount: activeUnits.length,
        streakDays,
      },
      activeUnits: activeUnits.map((unit) => ({
        id: unit.id.toString(),
        title: unit.title,
        progress: calculateUnitProgress(unit),
        learningGoal: unit.learningGoal,
        achievementLevel: unit.achievementLevel ?? 0,
      })),
      recentLogs: recentLogs.map((log) => ({
        title: log.title,
        date: log.logDate.toISOString(),
        duration: log.learningTime,
        content: log.note,
        unitId: log.unit.id.toString(),
        unitTitle: log.unit.title,
      })),
      progressData,
    };

    return NextResponse.json(
      { data: dashboardData },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "CDN-Cache-Control": "public, max-age=300",
          "Vercel-CDN-Cache-Control": "public, max-age=300",
        },
      }
    );
  } catch (error) {
    console.error("ダッシュボードデータ取得エラー:", error);
    return createErrorResponse(
      "ダッシュボードデータの取得中にエラーが発生しました",
      500
    );
  }
}

function calculateUnitProgress(unit: any): number {
  const targetLearningTime = 1200; // 20時間
  const totalLearningTime = unit.logs.reduce(
    (acc: number, log: { learningTime: number | null }) =>
      acc + (log.learningTime || 0),
    0
  );
  const progress = Math.min(
    (totalLearningTime / targetLearningTime) * 100,
    100
  );
  return Math.round(progress);
}
