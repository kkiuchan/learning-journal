import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getUserPlan } from "@/lib/plans";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const targetUserId = "cmbbjq9700000le0f9a9i6gja";

    console.log("🔍 Checking specific user:", targetUserId);

    // ユーザーの詳細情報を取得
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
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

    // willCancelAtPeriodEndの計算
    const willCancelAtPeriodEnd =
      user.cancelAtPeriodEnd &&
      user.subscriptionEnd &&
      new Date(user.subscriptionEnd) > now;

    // Stripeから情報を取得
    let stripeData = null;
    if (user.stripeSubscriptionId && stripe) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId
        );
        const sub = stripeSubscription as any;
        stripeData = {
          id: sub.id,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
          canceled_at: sub.canceled_at,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          trial_end: sub.trial_end,
        };
      } catch (error) {
        console.error("Stripe subscription retrieval error:", error);
        stripeData = { error: (error as Error).message };
      }
    }

    // Stripe Customer情報
    let stripeCustomer = null;
    if (user.stripeCustomerId && stripe) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        stripeCustomer = {
          id: customer.id,
          email: (customer as any).email,
          created: (customer as any).created,
        };
      } catch (error) {
        console.error("Stripe customer retrieval error:", error);
        stripeCustomer = { error: (error as Error).message };
      }
    }

    // 期限チェック詳細
    const subscriptionEndCheck = user.subscriptionEnd
      ? {
          subscriptionEnd: user.subscriptionEnd.toISOString(),
          now: now.toISOString(),
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
          trialEnd: user.trialEnd.toISOString(),
          now: now.toISOString(),
          isAfterNow: new Date(user.trialEnd) > now,
          diffMs: new Date(user.trialEnd).getTime() - now.getTime(),
          diffDays: Math.ceil(
            (new Date(user.trialEnd).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        }
      : null;

    return createApiResponse({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        subscriptionStart: user.subscriptionStart?.toISOString() || null,
        subscriptionEnd: user.subscriptionEnd?.toISOString() || null,
        trialEnd: user.trialEnd?.toISOString() || null,
        canceledAt: user.canceledAt?.toISOString() || null,
      },
      calculations: {
        currentPlan,
        isActive,
        willCancelAtPeriodEnd,
        subscriptionEndCheck,
        trialEndCheck,
      },
      stripeData,
      stripeCustomer,
      recommendations: {
        shouldProcessCheckout:
          !user.stripeSubscriptionId &&
          user.email === "bandman.gh.bs.dk.lav@gmail.com",
        checkoutSessionStatus: "open - payment not completed",
        nextSteps: [
          user.stripeSubscriptionId
            ? "User already has subscription"
            : "User needs to complete payment",
          "Check if checkout session expired",
          "Manual subscription creation may be needed",
        ],
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("User check error:", error);
    return createErrorResponse("ユーザー情報取得中にエラーが発生しました", 500);
  }
}
