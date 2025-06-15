import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { PlanId, SUBSCRIPTION_PLANS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
// import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";
import { createOrRetrieveStripeCustomer } from "@/lib/stripe-utils";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // await ensurePrismaConnected();

  try {
    const user = await getCurrentUserUnified();
    if (!user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    const { planId } = await req.json();

    // プランの検証
    if (!planId || !SUBSCRIPTION_PLANS[planId as PlanId]) {
      return createErrorResponse("無効なプランです", 400);
    }

    const plan = SUBSCRIPTION_PLANS[planId as PlanId];

    // 無料プランの場合はエラー
    if (planId === "FREE") {
      return createErrorResponse("無料プランはチェックアウト不要です", 400);
    }

    // ユーザーを取得
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        trialEnd: true, // トライアル利用履歴をチェック
      },
    });

    if (!userInfo) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // トライアル利用履歴をチェック
    const hasUsedTrial = userInfo.trialEnd !== null;

    console.log("🔍 Trial eligibility check:", {
      userId: userInfo.id,
      email: userInfo.email,
      hasUsedTrial,
      previousTrialEnd: userInfo.trialEnd?.toISOString(),
    });

    // 改善されたStripeカスタマーの作成/取得
    const customer = await createOrRetrieveStripeCustomer(
      userInfo.email,
      userInfo.name || undefined
    );

    // プランがPROの場合のstripePriceIdを取得
    if (planId !== "PRO" || !("stripePriceId" in plan)) {
      return createErrorResponse("無効なプランIDです", 400);
    }

    // チェックアウトセッションを作成
    const checkoutSession = await createCheckoutSession({
      customerId: customer.id,
      priceId: plan.stripePriceId,
      successUrl: `${req.nextUrl.origin}/dashboard?success=true&plan=${planId}`,
      cancelUrl: `${req.nextUrl.origin}/pricing?canceled=true`,
      metadata: {
        userId: userInfo.id,
        planId,
      },
      trialEligible: !hasUsedTrial, // トライアル未利用の場合のみtrue
    });

    return createApiResponse({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("チェックアウトセッション作成エラー:", error);
    return createErrorResponse(
      "チェックアウトセッションの作成に失敗しました",
      500
    );
  }
}
