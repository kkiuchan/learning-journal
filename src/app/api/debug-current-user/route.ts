import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserPlan } from "@/lib/plans";
// import { ensurePrismaConnected } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // await ensurePrismaConnected();

  try {
    const user = await getCurrentUser();

    if (!user?.email) {
      return createApiResponse({
        hasUser: false,
        message: "ユーザーが存在しません",
      });
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
        user.subscriptionEnd &&
        new Date(user.subscriptionEnd) > now);

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
      user: {
        userEmail: user.email,
        userName: user.name,
        hasUser: true,
        id: user.id,
        primaryAuthMethod: user.primaryAuthMethod,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStart: user.subscriptionStart,
        subscriptionEnd: user.subscriptionEnd,
        stripeCustomerId: user.stripeCustomerId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
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
            user.subscriptionEnd !== null
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
        isLifetime: user.subscriptionStatus === "lifetime",
        hasStripeSubscription: !!user.stripeCustomerId,
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
