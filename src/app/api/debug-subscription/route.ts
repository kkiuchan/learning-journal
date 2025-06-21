import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // データベースのユーザー情報を取得
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
        stripePriceId: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    let stripeSubscription = null;
    let stripeCustomer = null;

    // Stripeから最新の情報を取得
    if (user.stripeSubscriptionId && stripe) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId
        );
      } catch (error) {
        console.error("Stripe subscription retrieval error:", error);
      }
    }

    if (user.stripeCustomerId && stripe) {
      try {
        stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
      } catch (error) {
        console.error("Stripe customer retrieval error:", error);
      }
    }

    return createApiResponse({
      user,
      stripe: {
        subscription: stripeSubscription
          ? {
              id: stripeSubscription.id,
              status: stripeSubscription.status,
              cancel_at_period_end: (stripeSubscription as any)
                .cancel_at_period_end,
              canceled_at: (stripeSubscription as any).canceled_at,
              current_period_start: (stripeSubscription as any)
                .current_period_start,
              current_period_end: (stripeSubscription as any)
                .current_period_end,
              trial_end: (stripeSubscription as any).trial_end,
            }
          : null,
        customer: stripeCustomer
          ? {
              id: stripeCustomer.id,
              email: (stripeCustomer as any).email,
            }
          : null,
      },
      comparison: {
        cancelAtPeriodEnd: {
          database: user.cancelAtPeriodEnd,
          stripe: stripeSubscription
            ? (stripeSubscription as any).cancel_at_period_end
            : null,
          match:
            user.cancelAtPeriodEnd ===
            (stripeSubscription
              ? (stripeSubscription as any).cancel_at_period_end
              : false),
        },
        status: {
          database: user.subscriptionStatus,
          stripe: stripeSubscription?.status || null,
          match:
            user.subscriptionStatus === (stripeSubscription?.status || null),
        },
      },
    });
  } catch (error) {
    console.error("デバッグ取得エラー:", error);
    return createErrorResponse("デバッグ情報の取得に失敗しました", 500);
  }
}
