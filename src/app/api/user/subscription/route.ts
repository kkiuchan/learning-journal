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
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // ユーザーのサブスクリプション情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        trialEnd: true,
        cancelAtPeriodEnd: true,
        canceledAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    const currentPlan = getUserPlan(
      user.subscriptionStatus,
      user.subscriptionPlan
    );

    const isActive =
      user.subscriptionStatus === "lifetime" ||
      (user.subscriptionStatus === "active" &&
        user.subscriptionEnd &&
        new Date(user.subscriptionEnd) > new Date()) ||
      (user.subscriptionStatus === "trialing" &&
        ((user.trialEnd && new Date(user.trialEnd) > new Date()) ||
          (user.subscriptionEnd &&
            new Date(user.subscriptionEnd) > new Date())));

    return createApiResponse({
      currentPlan,
      isActive,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStart: user.subscriptionStart
        ? user.subscriptionStart.toISOString()
        : null,
      subscriptionEnd: user.subscriptionEnd
        ? user.subscriptionEnd.toISOString()
        : null,
      trialEnd: user.trialEnd ? user.trialEnd.toISOString() : null,
      isLifetime: user.subscriptionStatus === "lifetime",
      hasStripeSubscription: !!user.stripeSubscriptionId,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      canceledAt: user.canceledAt ? user.canceledAt.toISOString() : null,
      willCancelAtPeriodEnd:
        user.cancelAtPeriodEnd &&
        user.subscriptionEnd &&
        new Date(user.subscriptionEnd) > new Date(),
    });
  } catch (error) {
    console.error("サブスクリプション情報取得エラー:", error);
    return createErrorResponse(
      "サブスクリプション情報の取得に失敗しました",
      500
    );
  }
}
