import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // エラーログの取得
    const [logs, total] = await Promise.all([
      prisma.errorLog.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.errorLog.count(),
    ]);

    // レスポンスの構築
    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("エラーログの取得に失敗:", error);
    return NextResponse.json(
      { error: "エラーログの取得に失敗しました" },
      { status: 500 }
    );
  }
}
