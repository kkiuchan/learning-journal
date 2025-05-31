import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // 管理者権限チェック（簡単版）
    if (session.user.email !== "bandman.gh.bs.dk.lav@gmail.com") {
      return createErrorResponse("管理者権限が必要です", 403);
    }

    // trialingステータスでsubscriptionPlanがnullのユーザーを修正
    const result = await prisma.user.updateMany({
      where: {
        subscriptionStatus: "trialing",
        subscriptionPlan: null,
      },
      data: {
        subscriptionPlan: "pro",
      },
    });

    return createApiResponse({
      message: "トライアルユーザーのデータを修正しました",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("データ修正エラー:", error);
    return createErrorResponse("データ修正に失敗しました", 500);
  }
}
