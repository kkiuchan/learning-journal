import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { PlanId, SUBSCRIPTION_PLANS } from "@/lib/plans";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        trialEnd: true, // トライアル利用履歴をチェック
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // トライアル利用履歴をチェック
    const hasUsedTrial = user.trialEnd !== null;

    console.log("🔍 Trial eligibility check:", {
      userId: user.id,
      email: user.email,
      hasUsedTrial,
      previousTrialEnd: user.trialEnd?.toISOString(),
    });

    // Stripeカスタマーの作成/取得
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await createStripeCustomer(
        user.email,
        user.name || undefined
      );
      customerId = customer.id;

      // DBにカスタマーIDを保存
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // プランがPROの場合のstripePriceIdを取得
    if (planId !== "PRO" || !("stripePriceId" in plan)) {
      return createErrorResponse("無効なプランIDです", 400);
    }

    // チェックアウトセッションを作成
    const checkoutSession = await createCheckoutSession({
      customerId,
      priceId: plan.stripePriceId,
      successUrl: `${req.nextUrl.origin}/dashboard?success=true&plan=${planId}`,
      cancelUrl: `${req.nextUrl.origin}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
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
