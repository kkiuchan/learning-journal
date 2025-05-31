import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await ensurePrismaConnected();

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
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    if (!user.stripeSubscriptionId) {
      return createErrorResponse(
        "Stripeサブスクリプションが見つかりません",
        404
      );
    }

    if (!stripe) {
      return createErrorResponse("Stripe設定エラー", 500);
    }

    // Stripeから最新のサブスクリプション情報を取得
    const stripeSubscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    const sub = stripeSubscription as any;

    console.log("🔄 Manual sync - Stripe subscription data:", {
      id: sub.id,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at,
      current_period_end: sub.current_period_end,
      trial_end: sub.trial_end,
    });

    // 期間とキャンセル情報を計算
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;
    const periodStart = sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null;
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
    const now = new Date();
    const shouldDeactivate =
      sub.cancel_at_period_end && periodEnd && periodEnd <= now;

    // canceledAtの処理
    const canceledAt = sub.cancel_at_period_end
      ? sub.canceled_at
        ? new Date(sub.canceled_at * 1000)
        : new Date()
      : null;

    // ユーザーのサブスクリプション状態を更新
    const isActive = sub.status === "active" && !shouldDeactivate;
    const isTrialing = sub.status === "trialing";

    console.log("📅 Date conversion check:", {
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      periodStart: periodStart?.toISOString(),
      periodEnd: periodEnd?.toISOString(),
      isActive,
      isTrialing,
    });

    const updateData = {
      subscriptionStatus: shouldDeactivate ? "canceled" : sub.status,
      subscriptionPlan: isActive || isTrialing ? "pro" : null,
      subscriptionStart:
        (isActive || isTrialing) && periodStart ? periodStart : null,
      subscriptionEnd: (isActive || isTrialing) && periodEnd ? periodEnd : null,
      trialEnd: trialEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      canceledAt: canceledAt,
    };

    console.log("🗃️ Manual sync - Database update data:", updateData);

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // 更新後のデータを確認
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        cancelAtPeriodEnd: true,
        canceledAt: true,
        subscriptionEnd: true,
      },
    });

    return createApiResponse({
      message: "サブスクリプション情報を同期しました",
      before: {
        cancelAtPeriodEnd: null,
        canceledAt: null,
      },
      after: updatedUser,
      stripe: {
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at,
      },
    });
  } catch (error) {
    console.error("サブスクリプション同期エラー:", error);
    return createErrorResponse(
      "サブスクリプション同期に失敗しました: " + (error as Error).message,
      500
    );
  }
}
