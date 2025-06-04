import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 管理者権限チェック（必要に応じて実装）
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    // }

    // 統計データを並行取得
    const [
      totalUsers,
      totalUnits,
      totalLogs,
      totalComments,
      activeUsers,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.unit.count(),
      prisma.log.count(),
      prisma.comment.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日以内
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日以内
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          recent: recentUsers,
        },
        content: {
          units: totalUnits,
          logs: totalLogs,
          comments: totalComments,
        },
      },
    });
  } catch (error) {
    console.error("統計データ取得エラー:", error);
    return NextResponse.json(
      { error: "統計データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
