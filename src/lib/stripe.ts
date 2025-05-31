import Stripe from "stripe";
import { getUserPlan } from "./plans";

// 環境判定
export const isProduction = process.env.NODE_ENV === "production";
export const stripeEnvironment = isProduction ? "live" : "test";

// サーバーサイドでのみ実行されることを確認
if (typeof window === "undefined" && !process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// 起動時に環境確認ログ
if (typeof window === "undefined") {
  console.log(`🔧 Stripe Environment: ${stripeEnvironment}`);
  console.log(
    `🔑 Stripe Key Type: ${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "LIVE" : "TEST"}`
  );
}

// サーバーサイドでのみStripeクライアントを初期化
export const stripe =
  typeof window === "undefined"
    ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-05-28.basil",
        typescript: true,
      })
    : null;

// Stripe Customer作成
export async function createStripeCustomer(email: string, name?: string) {
  if (!stripe) throw new Error("Stripe not initialized");

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      source: "learning-journal",
    },
  });

  return customer;
}

// チェックアウトセッション作成
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
  trialEligible = true,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trialEligible?: boolean;
}) {
  if (!stripe) throw new Error("Stripe not initialized");

  // トライアル適用の判定
  const subscriptionData: any = {
    metadata,
  };

  if (trialEligible) {
    subscriptionData.trial_period_days = 7; // 7日間の無料トライアル
    console.log("✅ Trial applied: 7 days free trial");
  } else {
    console.log("❌ Trial not applied: User has already used trial");
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: subscriptionData,
  });

  return session;
}

// カスタマーポータルセッション作成
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  if (!stripe) throw new Error("Stripe not initialized");

  try {
    console.log("🏪 Creating customer portal session:", {
      customerId,
      returnUrl,
      environment: stripeEnvironment,
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log("✅ Customer portal session created successfully:", {
      id: session.id,
      url: session.url,
    });

    return session;
  } catch (error) {
    console.error("❌ Customer portal session creation failed:", {
      customerId,
      returnUrl,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Stripeエラーの詳細ログ
    if (error instanceof Stripe.errors.StripeError) {
      console.error("🔴 Stripe Error Details:", {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      });
    }

    throw error;
  }
}

// ユーザーのサブスクリプション情報を取得
export async function getUserSubscriptionInfo(userId: string) {
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionEnd: true,
      trialEnd: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const currentPlan = getUserPlan(
    user.subscriptionStatus,
    user.subscriptionPlan
  );

  // ライフタイム、アクティブ、またはトライアル期間中は有効
  const isActive =
    user.subscriptionStatus === "lifetime" ||
    (user.subscriptionStatus === "active" &&
      user.subscriptionEnd &&
      new Date(user.subscriptionEnd) > new Date()) ||
    (user.subscriptionStatus === "trialing" &&
      ((user.trialEnd && new Date(user.trialEnd) > new Date()) ||
        (user.subscriptionEnd && new Date(user.subscriptionEnd) > new Date())));

  return {
    plan: currentPlan,
    isActive,
    subscriptionEnd: user.subscriptionEnd,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    canceledAt: user.canceledAt,
    willCancelAtPeriodEnd:
      user.cancelAtPeriodEnd &&
      user.subscriptionEnd &&
      new Date(user.subscriptionEnd) > new Date(),
  };
}

// AI機能の利用可否をチェック
export async function canUseAIFeatures(userId: string): Promise<boolean> {
  const subscriptionInfo = await getUserSubscriptionInfo(userId);

  if (!subscriptionInfo) {
    return false; // ユーザーが見つからない場合は無料プラン扱い
  }

  // プロプランで有効な場合にAI機能を利用可能
  return subscriptionInfo.plan === "PRO" && subscriptionInfo.isActive === true;
}

// プラン制限エラーのレスポンスを生成
export function createPlanLimitResponse(featureName: string) {
  return {
    error: `${featureName}はプロプランの機能です。プロプランにアップグレードしてご利用ください。`,
    code: "PLAN_LIMIT_EXCEEDED",
    upgradeUrl: "/pricing",
  };
}
