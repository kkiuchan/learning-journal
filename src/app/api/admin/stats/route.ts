import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 認証チェック（管理者のみアクセス可能）
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 将来的に管理者ロールを実装する場合はここでチェック
    // if (session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    // }

    // 各種統計情報の取得
    const [totalUsers, totalUnits, totalLogs, totalErrors] = await Promise.all([
      prisma.user.count(),
      prisma.unit.count(),
      prisma.log.count(),
      prisma.errorLog.count(),
    ]);

    // レスポンスの構築
    return NextResponse.json({
      data: {
        totalUsers,
        totalUnits,
        totalLogs,
        totalErrors,
      },
    });
  } catch (error) {
    console.error("統計情報の取得に失敗:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
