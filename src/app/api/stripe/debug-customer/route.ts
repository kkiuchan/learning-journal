import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
// import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // ユーザー情報を取得
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        trialEnd: true,
      },
    });

    if (!userInfo) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    let stripeCustomer = null;
    let stripeError = null;

    // Stripe Customerが存在する場合、Stripeから情報を取得
    if (userInfo.stripeCustomerId && stripe) {
      try {
        stripeCustomer = await stripe.customers.retrieve(
          userInfo.stripeCustomerId
        );
      } catch (error) {
        stripeError = error instanceof Error ? error.message : String(error);
        console.error("❌ Stripe customer retrieval error:", error);
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      stripeEnvironment: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
        ? "live"
        : "test",
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        stripeCustomerId: userInfo.stripeCustomerId,
        subscriptionStatus: userInfo.subscriptionStatus,
        subscriptionPlan: userInfo.subscriptionPlan,
      },
      stripeCustomer: stripeCustomer
        ? {
            id: stripeCustomer.id,
            email: (stripeCustomer as any).email,
            created: new Date(
              (stripeCustomer as any).created * 1000
            ).toISOString(),
            deleted: (stripeCustomer as any).deleted || false,
          }
        : null,
      stripeError,
      hasStripeAccess: !!stripe,
    };

    console.log("🔍 Debug customer info:", debugInfo);

    return createApiResponse({
      user: userInfo,
      debug: {
        hasStripeCustomer: !!userInfo.stripeCustomerId,
        subscriptionActive: userInfo.subscriptionStatus === "active",
        trialUsed: !!userInfo.trialEnd,
      },
    });
  } catch (error) {
    console.error("デバッグ情報取得エラー:", error);
    return createErrorResponse(
      "デバッグ情報の取得中にエラーが発生しました",
      500
    );
  }
}
