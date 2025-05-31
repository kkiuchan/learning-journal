import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getUserPlan } from "@/lib/plans";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return createApiResponse({
        hasSession: false,
        message: "セッションが存在しません",
      });
    }

    // 現在ログインしているユーザーの詳細情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        trialEnd: true,
        cancelAtPeriodEnd: true,
        canceledAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // getUserPlan関数の動作をテスト
    const currentPlan = getUserPlan(
      user.subscriptionStatus,
      user.subscriptionPlan
    );

    // isActiveの計算ロジックをテスト
    const now = new Date();
    const isActive =
      user.subscriptionStatus === "lifetime" ||
      (user.subscriptionStatus === "active" &&
        user.subscriptionEnd &&
        new Date(user.subscriptionEnd) > now) ||
      (user.subscriptionStatus === "trialing" &&
        ((user.trialEnd && new Date(user.trialEnd) > now) ||
          (user.subscriptionEnd && new Date(user.subscriptionEnd) > now)));

    // 期限チェック詳細
    const subscriptionEndCheck = user.subscriptionEnd
      ? {
          subscriptionEnd: user.subscriptionEnd.toISOString(),
          subscriptionEndDate: new Date(user.subscriptionEnd).toISOString(),
          now: now.toISOString(),
          isAfterNow: new Date(user.subscriptionEnd) > now,
          diffMs: new Date(user.subscriptionEnd).getTime() - now.getTime(),
          diffDays: Math.ceil(
            (new Date(user.subscriptionEnd).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }
      : null;

    // UI判定ロジック
    const isCurrentPlan = currentPlan === "PRO";
    const isProActive = currentPlan === "PRO" && isActive;

    return createApiResponse({
      session: {
        userEmail: session.user.email,
        userName: session.user.name,
        hasSession: true,
      },
      user: user,
      calculations: {
        currentPlan,
        isActive,
        subscriptionEndCheck,
        uiLogic: {
          isCurrentPlan,
          isProActive,
          shouldShowManageButton: isCurrentPlan && isProActive,
          shouldShowProButton: !isCurrentPlan || !isProActive,
          expectedButtonText:
            user.trialEnd !== null
              ? "プロプランを始める（即開始）"
              : "7日間無料でお試し",
        },
      },
      expectedAPIResponse: {
        currentPlan,
        isActive,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStart: user.subscriptionStart,
        subscriptionEnd: user.subscriptionEnd,
        trialEnd: user.trialEnd,
        isLifetime: user.subscriptionStatus === "lifetime",
        hasStripeSubscription: !!user.stripeSubscriptionId,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        canceledAt: user.canceledAt,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("デバッグAPI エラー:", error);
    return createErrorResponse(
      "デバッグに失敗しました: " + (error as Error).message,
      500
    );
  }
}
