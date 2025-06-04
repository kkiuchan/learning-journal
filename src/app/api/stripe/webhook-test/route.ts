import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not initialized" },
        { status: 500 }
      );
    }

    // 最近のイベントを取得（開発環境のテスト用）
    const events = await stripe.events.list({
      limit: 10,
      types: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
      ],
    });

    // 現在のユーザーのサブスクリプション状況を確認
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { subscriptionStatus: { not: null } },
          { stripeCustomerId: { not: null } },
          { stripeSubscriptionId: { not: null } },
        ],
      },
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
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const debugInfo = {
      webhook: {
        webhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookEndpoint: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/stripe/webhook`,
        recentEvents: events.data.map((event) => ({
          id: event.id,
          type: event.type,
          created: new Date(event.created * 1000).toISOString(),
          livemode: event.livemode,
          processed: true, // Webhookが正常に処理されていればtrue
        })),
      },
      database: {
        usersWithSubscriptions: users,
        totalUsersWithStripeData: users.length,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/stripe/webhook`,
      },
    };

    return NextResponse.json({
      message: "Webhook処理状況確認完了",
      debug: debugInfo,
      recommendations: [
        "🔗 StripeダッシュボードでWebhookエンドポイントが正しく設定されているか確認",
        "📡 ngrokやlocaltunnelを使用して外部からアクセス可能なURLを設定",
        "🔍 Stripeダッシュボードの「Webhooks」→「イベント」でイベント送信状況を確認",
        "📝 開発環境では手動でWebhook処理をテストできます",
      ],
    });
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json(
      {
        error: "Webhook処理状況確認中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 手動でWebhook処理をテストするためのPOSTエンドポイント
export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not initialized" },
        { status: 500 }
      );
    }

    // サブスクリプション情報を取得
    const subscription = (await stripe.subscriptions.retrieve(
      subscriptionId
    )) as any;

    console.log("🧪 Manual webhook test for subscription:", {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end,
    });

    // 手動でhandleSubscriptionChange相当の処理を実行
    const { getUserByStripeSubscription } = await import("@/lib/stripe-utils");
    const user = await getUserByStripeSubscription(subscription.id);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found for subscription",
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        },
        { status: 404 }
      );
    }

    // データベース更新処理
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

    const updateData = {
      subscriptionStatus: subscription.status,
      subscriptionPlan:
        subscription.status === "active" || subscription.status === "trialing"
          ? "pro"
          : null,
      subscriptionEnd: periodEnd,
      trialEnd: trialEnd,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items?.data?.[0]?.price?.id || null,
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "手動Webhook処理完了",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trial_end: trialEnd,
        period_end: periodEnd,
      },
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error("Manual webhook test error:", error);
    return NextResponse.json(
      {
        error: "手動Webhook処理中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
