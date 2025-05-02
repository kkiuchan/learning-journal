import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    try {
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

      // 進行中と完了済みのユニット数を取得
      const activeUnits = await prisma.unit.findMany({
        where: {
          userId,
          status: "IN_PROGRESS",
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
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
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < recentLogs.length; i++) {
        const logDate = new Date(recentLogs[i].logDate);
        logDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === streakDays) {
          streakDays++;
          currentDate = logDate;
        } else {
          break;
        }
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
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const log = dailyLogs.find(
          (log) => new Date(log.logDate).toDateString() === date.toDateString()
        );

        return {
          name: `${date.getMonth() + 1}/${date.getDate()}`,
          hours: (log?._sum.learningTime || 0) / 60, // 分から時間に変換
        };
      }).reverse();

      return NextResponse.json({
        stats: {
          totalLearningTime: totalLearningTime / 60, // 分から時間に変換
          completedUnitsCount,
          activeUnitsCount: activeUnits.length,
          streakDays,
        },
        activeUnits: activeUnits.map((unit) => ({
          title: unit.title,
          progress: calculateProgress(unit),
          startDate: unit.startDate,
          endDate: unit.endDate,
        })),
        recentLogs: recentLogsWithDetails.map((log) => ({
          title: log.title,
          date: log.logDate,
          duration: log.learningTime,
          content: log.note,
          unitTitle: log.unit.title,
        })),
        progressData,
      });
    } catch (error) {
      console.error("Database error:", error);
      return new NextResponse("データベースエラーが発生しました", {
        status: 500,
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return new NextResponse("認証エラーが発生しました", { status: 401 });
  }
}

function calculateProgress(unit: any): number {
  if (!unit.startDate || !unit.endDate) return 0;

  const totalDuration = unit.endDate.getTime() - unit.startDate.getTime();
  const elapsed = Date.now() - unit.startDate.getTime();
  const progress = (elapsed / totalDuration) * 100;

  return Math.min(Math.max(Math.round(progress), 0), 100);
}
