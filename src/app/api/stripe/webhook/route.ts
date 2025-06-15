import { createErrorResponse } from "@/lib/api-utils";
import {
  sendPaymentFailedNotification,
  sendPaymentSucceededNotification,
  sendSubscriptionCancelledNotification,
  sendTrialEndingWarning,
  sendTrialStartedWelcome,
} from "@/lib/email-templates";
// import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { isProduction, stripe } from "@/lib/stripe";
import {
  getUserByStripeCustomer,
  getUserByStripeSubscription,
} from "@/lib/stripe-utils";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// エラー通知関数（本番環境用）
async function notifyWebhookError(
  error: Error,
  eventType: string,
  eventId?: string
) {
  if (isProduction) {
    // 本番環境では管理者に通知（実装は後で追加）
    console.error(
      `🚨 PRODUCTION Webhook Error [${eventType}] ${eventId}:`,
      error.message
    );
    // TODO: Slack, Discord, メール等での通知実装
  } else {
    console.error(`❌ ${eventType} handler error:`, error);
  }
}

export async function POST(req: NextRequest) {
  // 本番環境用のログレベル調整
  if (isProduction) {
    console.log("🔔 Webhook received", {
      method: req.method,
      hasSignature: !!req.headers.get("stripe-signature"),
    });
  } else {
    console.log("🔔 Webhook received!", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });
  }

  // await ensurePrismaConnected();

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  if (!isProduction) {
    console.log("🔍 Webhook processing:", {
      bodyLength: body.length,
      hasSignature: !!sig,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    });
  }

  let event: Stripe.Event;

  try {
    if (!stripe) {
      throw new Error("Stripe client not initialized");
    }
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (isProduction) {
      console.log("✅ Webhook verified:", event.type, event.id);
    } else {
      console.log("✅ Webhook signature verified:", event.type);
    }
  } catch (err) {
    const error = err as Error;
    await notifyWebhookError(error, "webhook_verification", "unknown");
    return createErrorResponse("Webhook signature verification failed", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = subscription as any;

        if (isProduction) {
          console.log("🔄 Subscription updated:", sub.id, sub.status);
        } else {
          console.log("🔄 Subscription updated:", {
            id: sub.id,
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: sub.current_period_end,
          });
        }

        await handleSubscriptionChange(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("❌ Subscription deleted:", subscription.id);
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      case "invoice.upcoming": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleUpcomingInvoice(invoice);
        break;
      }
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
        break;
      }
      default:
        if (!isProduction) {
          console.log(`Unhandled event type: ${event.type}`);
        }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await notifyWebhookError(
      error as Error,
      event?.type || "unknown",
      event?.id
    );
    return createErrorResponse("Webhook handler error", 500);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId } = session.metadata || {};

  console.log("🎯 Processing checkout completion:", {
    sessionId: session.id,
    userId,
    planId,
    subscriptionId: session.subscription,
  });

  if (!userId || !planId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  // サブスクリプション情報を取得
  if (!stripe) {
    console.error("Stripe client not initialized");
    return;
  }

  const subscription = (await stripe.subscriptions.retrieve(
    session.subscription as string
  )) as any;

  console.log("📋 Subscription details:", {
    id: subscription.id,
    status: subscription.status,
    trial_end: subscription.trial_end,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    items: subscription.items.data.map((item: any) => ({
      priceId: item.price.id,
      productId: item.price.product,
    })),
  });

  // 日付の安全な変換
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : new Date();
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日後

  // トライアル期間終了日
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  // トライアル期間中の場合、subscriptionEndはtrialEndにする
  const subscriptionEndDate =
    subscription.status === "trialing" && trialEnd ? trialEnd : periodEnd;

  console.log("📅 Converted dates:", {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    trialEnd: trialEnd?.toISOString(),
    subscriptionEndDate: subscriptionEndDate.toISOString(),
    isTrialing: subscription.status === "trialing",
  });

  // ユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
    },
  });

  if (!user) {
    console.error("User not found:", userId);
    return;
  }

  // ユーザー情報を更新
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionPlan: planId.toLowerCase(),
      subscriptionStart: periodStart,
      subscriptionEnd: subscriptionEndDate,
      trialEnd: trialEnd, // トライアル期間終了日を保存（なければnull）
      cancelAtPeriodEnd: false, // 新規サブスクリプションなのでキャンセルフラグはfalse
      canceledAt: null, // 新規サブスクリプションなのでキャンセル日時はnull
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items?.data?.[0]?.price?.id || "",
    },
  });

  // トライアル開始時のウェルカムメールを送信
  if (subscription.status === "trialing" && trialEnd) {
    console.log("📧 Sending trial started welcome email");
    await sendTrialStartedWelcome(user.email, user.name, trialEnd);
  }

  console.log(`✅ Subscription activated for user ${userId}, plan ${planId}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const sub = subscription as any;

  // 新しいメールベースのユーザー特定を使用
  const user = await getUserByStripeSubscription(sub.id);

  if (!user) {
    console.error("User not found for subscription:", sub.id);
    return;
  }

  console.log("🔄 Subscription change details:", {
    userId: user.id,
    userEmail: user.email,
    subscriptionId: sub.id,
    status: sub.status,
    trial_end: sub.trial_end,
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at,
    current_period_start: sub.current_period_start,
    current_period_end: sub.current_period_end,
  });

  // periodStart, periodEndの厳密なnull判定
  const periodEnd =
    typeof sub.current_period_end === "number" && sub.current_period_end > 0
      ? new Date(sub.current_period_end * 1000)
      : null;
  const periodStart =
    typeof sub.current_period_start === "number" && sub.current_period_start > 0
      ? new Date(sub.current_period_start * 1000)
      : null;
  const trialEnd =
    typeof sub.trial_end === "number" && sub.trial_end > 0
      ? new Date(sub.trial_end * 1000)
      : null;
  const now = new Date();
  const shouldDeactivate =
    sub.cancel_at_period_end && periodEnd && periodEnd <= now;

  // canceledAtの処理を改善
  const canceledAt = sub.cancel_at_period_end
    ? sub.canceled_at
      ? new Date(sub.canceled_at * 1000)
      : new Date()
    : null;

  console.log("📝 Update data being prepared:", {
    subscriptionStatus: shouldDeactivate ? "canceled" : sub.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    canceledAt: canceledAt,
    shouldDeactivate,
    periodEnd: periodEnd?.toISOString(),
    periodStart: periodStart?.toISOString(),
  });

  // ユーザーのサブスクリプション状態を更新
  const isActive = sub.status === "active" && !shouldDeactivate;
  const isTrialing = sub.status === "trialing";

  // キャンセル予約でも期間中は有効として扱う
  const isCurrentlyValid =
    (sub.status === "active" || sub.status === "trialing") && !shouldDeactivate;

  // 既存のDB値を維持するために現在のユーザーデータを取得
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      subscriptionStart: true,
      subscriptionEnd: true,
    },
  });

  const updateData = {
    subscriptionStatus: shouldDeactivate ? "canceled" : sub.status,
    subscriptionPlan: isCurrentlyValid ? "pro" : null,
    subscriptionStart: isCurrentlyValid
      ? periodStart || currentUser?.subscriptionStart || null
      : null,
    subscriptionEnd:
      periodEnd && !shouldDeactivate
        ? periodEnd
        : currentUser?.subscriptionEnd || null,
    trialEnd: trialEnd, // トライアル期間終了日を更新
    cancelAtPeriodEnd: sub.cancel_at_period_end || false,
    canceledAt: canceledAt,
  };

  console.log("🗃️ Database update data:", updateData);

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  // 更新後のデータを確認
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
      subscriptionEnd: true,
    },
  });

  console.log("✅ Updated user data:", updatedUser);

  console.log(
    `✅ Subscription ${shouldDeactivate ? "deactivated" : sub.status} for user ${user.id}`
  );

  // メール通知
  if (sub.cancel_at_period_end && !shouldDeactivate) {
    console.log("📧 Sending cancellation notification");
    if (periodEnd) {
      await sendSubscriptionCancelledNotification(
        user.email,
        user.name,
        periodEnd
      );
    }
  } else if (shouldDeactivate) {
    console.log("📧 Sending final cancellation notification");
    if (periodEnd) {
      await sendSubscriptionCancelledNotification(
        user.email,
        user.name,
        periodEnd
      );
    }
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const inv = invoice as any;

  // 新しいメールベースのユーザー特定を使用
  const user = await getUserByStripeCustomer(inv.customer as string);

  if (!user) {
    console.error("User not found for customer:", inv.customer);
    return;
  }

  console.log(
    `Payment succeeded for user ${user.id}, amount: ${inv.amount_paid || 0}, billing_reason: ${inv.billing_reason}`
  );

  // メール通知 - 実際に金額が発生した場合のみ
  const amount = inv.amount_paid || 0;
  if (amount > 0) {
    console.log("📧 Sending payment success notification");
    await sendPaymentSucceededNotification(
      user.email,
      user.name,
      amount,
      inv.hosted_invoice_url
    );
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as any;

  // 新しいメールベースのユーザー特定を使用
  const user = await getUserByStripeCustomer(inv.customer as string);

  if (!user) {
    console.error("User not found for customer:", inv.customer);
    return;
  }

  console.log(`Payment failed for user ${user.id}`);

  // 3回以上連続失敗の場合、一時的に機能制限
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "past_due",
    },
  });

  console.log(`⚠️ User ${user.id} marked as past_due due to payment failure`);

  // メール通知
  await sendPaymentFailedNotification(
    user.email,
    user.name,
    inv.amount_due || 0
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = subscription as any;

  // 新しいメールベースのユーザー特定を使用
  const user = await getUserByStripeSubscription(sub.id);

  if (!user) {
    console.error("User not found for subscription:", sub.id);
    return;
  }

  // ユーザー情報を更新
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "deleted",
      subscriptionPlan: null,
      subscriptionStart: null,
      subscriptionEnd: null,
      trialEnd: null, // trialEndもクリア
      cancelAtPeriodEnd: false, // キャンセルフラグもリセット
      canceledAt: null, // キャンセル日時もクリア
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  });

  console.log(`✅ Subscription deleted for user ${user.id}`);

  // メール通知
  await sendSubscriptionCancelledNotification(
    user.email,
    user.name,
    new Date()
  );
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  const inv = invoice as any;

  // 新しいメールベースのユーザー特定を使用
  const user = await getUserByStripeCustomer(inv.customer as string);

  if (!user) {
    console.error("User not found for customer:", inv.customer);
    return;
  }

  console.log(
    `Upcoming invoice for user ${user.id}, amount: ${inv.amount_due || 0}`
  );
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const sub = subscription as any;

  // 新しいメールベースのユーザー特定を使用
  const user = await getUserByStripeSubscription(sub.id);

  if (!user) {
    console.error("User not found for subscription:", sub.id);
    return;
  }

  console.log(
    `Trial will end for user ${user.id}, current period end: ${sub.current_period_end}`
  );

  const trialEndDate = new Date(sub.current_period_end * 1000);

  // ユーザー情報を更新
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "trial_will_end",
      subscriptionPlan: "pro", // トライアル期間終了警告でもproプランを維持
      subscriptionStart: new Date(sub.current_period_start * 1000),
      subscriptionEnd: trialEndDate,
      trialEnd: trialEndDate,
    },
  });

  // トライアル期間終了警告メールを送信
  const now = new Date();
  const daysUntilEnd = Math.ceil(
    (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  console.log("📧 Sending trial ending warning notification");
  await sendTrialEndingWarning(
    user.email,
    user.name,
    Math.max(1, daysUntilEnd),
    trialEndDate
  );

  console.log(`✅ Trial will end for user ${user.id}`);
}
