import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getUserPlan } from "@/lib/plans";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);

    // 特定のユーザー（arisa）の情報をデバッグ
    const arisaEmail = "arisa.kaneko106@gmail.com";

    console.log("🔍 Debug session info:", {
      hasSession: !!session,
      userEmail: session?.user?.email,
      targetEmail: arisaEmail,
    });

    // arisoユーザーの詳細情報を取得
    const user = await prisma.user.findUnique({
      where: { email: arisaEmail },
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
      return createErrorResponse("arisoユーザーが見つかりません", 404);
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

    // willCancelAtPeriodEndの計算
    const willCancelAtPeriodEnd =
      user.cancelAtPeriodEnd &&
      user.subscriptionEnd &&
      new Date(user.subscriptionEnd) > now;

    // 期限チェック
    const subscriptionEndCheck = user.subscriptionEnd
      ? {
          subscriptionEnd: user.subscriptionEnd,
          subscriptionEndDate: new Date(user.subscriptionEnd),
          now: now,
          isAfterNow: new Date(user.subscriptionEnd) > now,
          diffMs: new Date(user.subscriptionEnd).getTime() - now.getTime(),
          diffDays: Math.ceil(
            (new Date(user.subscriptionEnd).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }
      : null;

    const trialEndCheck = user.trialEnd
      ? {
          trialEnd: user.trialEnd,
          trialEndDate: new Date(user.trialEnd),
          now: now,
          isAfterNow: new Date(user.trialEnd) > now,
          diffMs: new Date(user.trialEnd).getTime() - now.getTime(),
          diffDays: Math.ceil(
            (new Date(user.trialEnd).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }
      : null;

    // セッション情報での判定結果
    const sessionBasedResult =
      session?.user?.email === arisaEmail
        ? {
            sessionUserEmail: session.user.email,
            isMatchingUser: true,
            sessionData: session.user,
          }
        : {
            sessionUserEmail: session?.user?.email || null,
            isMatchingUser: false,
            note: "セッションユーザーとarisaユーザーが一致しません",
          };

    return createApiResponse({
      debugInfo: {
        targetUser: arisaEmail,
        session: sessionBasedResult,
        timestamp: now.toISOString(),
      },
      rawDatabaseData: user,
      calculatedValues: {
        currentPlan,
        isActive,
        willCancelAtPeriodEnd,
        subscriptionEndCheck,
        trialEndCheck,
      },
      expectedApiResponse: {
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
        willCancelAtPeriodEnd,
      },
      uiExpectedBehavior: {
        shouldShowProButton: !isActive || currentPlan !== "PRO",
        shouldShowManageButton: isActive && currentPlan === "PRO",
        buttonText:
          user.trialEnd !== null
            ? "プロプランを始める（即開始）"
            : "7日間無料でお試し",
        explanation: `isActive: ${isActive}, currentPlan: ${currentPlan}, hasUsedTrial: ${user.trialEnd !== null}`,
      },
    });
  } catch (error) {
    console.error("デバッグAPI エラー:", error);
    return createErrorResponse(
      "デバッグに失敗しました: " + (error as Error).message,
      500
    );
  }
}
