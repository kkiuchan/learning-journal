import { User } from "@prisma/client";
import { prisma } from "./prisma";
import { stripe } from "./stripe";

/**
 * Stripe Customer IDからメールベースでユーザーを特定する関数
 * Supabase Auth移行に対応した安全な方式
 */
export async function getUserByStripeCustomer(
  customerId: string
): Promise<User | null> {
  if (!stripe) {
    console.error("Stripe not initialized");
    return null;
  }

  // 1. Stripe Customerからメールアドレスを取得
  let customerEmail: string;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    customerEmail = (customer as any).email;

    if (!customerEmail) {
      console.error("No email found for Stripe customer:", customerId);
      return null;
    }
  } catch (error) {
    console.error("Failed to retrieve Stripe customer:", customerId, error);
    return null;
  }

  // 2. デュアル管理: 既存方式と新方式の両方で検索
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { stripeCustomerId: customerId }, // 従来方式（互換性）
        { email: customerEmail }, // 新方式（メールベース）
      ],
    },
  });

  if (!user) {
    console.error("User not found for email:", customerEmail);
    return null;
  }

  // 3. Stripe Customer IDを更新（必要に応じて）
  if (user.stripeCustomerId !== customerId) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
      console.log("Updated stripeCustomerId for user:", user.email);
    } catch (error) {
      console.error("Failed to update stripeCustomerId:", error);
    }
  }

  return user;
}

/**
 * Stripe Subscription IDからメールベースでユーザーを特定する関数
 */
export async function getUserByStripeSubscription(
  subscriptionId: string
): Promise<User | null> {
  if (!stripe) {
    console.error("Stripe not initialized");
    return null;
  }

  try {
    // 1. Subscriptionから Customer ID を取得
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer as string;

    // 2. Customer ID からユーザーを特定
    return await getUserByStripeCustomer(customerId);
  } catch (error) {
    console.error("Failed to retrieve subscription:", subscriptionId, error);
    return null;
  }
}

/**
 * 改善されたStripe Customer作成関数
 * 既存Customerの重複チェックを含む
 */
export async function createOrRetrieveStripeCustomer(
  email: string,
  name?: string
): Promise<any> {
  if (!stripe) throw new Error("Stripe not initialized");

  // 1. DBから既存のstripeCustomerIdを確認
  const userWithCustomer = await prisma.user.findUnique({
    where: { email },
    select: { stripeCustomerId: true },
  });

  // 2. 既存のCustomer IDがある場合、Stripeから確認
  if (userWithCustomer?.stripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(
        userWithCustomer.stripeCustomerId
      );

      if (existingCustomer && !existingCustomer.deleted) {
        console.log("Existing Stripe customer found from DB:", email);
        return existingCustomer;
      }
    } catch (error) {
      console.log("Existing customer not found in Stripe, will create new one");
    }
  }

  // 3. メールベースで既存Customerを検索
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const existingCustomer = existingCustomers.data[0];
    console.log("Existing Stripe customer found by email:", email);

    // DBのstripeCustomerIdを更新
    await updateUserStripeCustomerId(email, existingCustomer.id);

    return existingCustomer;
  }

  // 4. 新規Customer作成
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      source: "learning-journal",
      userEmail: email,
      createdAt: new Date().toISOString(),
    },
  });

  console.log("New Stripe customer created:", email);

  // DBのstripeCustomerIdを更新
  await updateUserStripeCustomerId(email, customer.id);

  return customer;
}

/**
 * ユーザーのStripe Customer IDを更新する関数
 */
async function updateUserStripeCustomerId(
  email: string,
  stripeCustomerId: string
): Promise<void> {
  try {
    await prisma.user.update({
      where: { email },
      data: { stripeCustomerId },
    });
    console.log("Updated stripeCustomerId for user:", email);
  } catch (error) {
    console.error("Failed to update stripeCustomerId:", error);
  }
}

/**
 * ユーザーのサブスクリプション情報を安全に取得する関数
 */
export async function getUserSubscriptionSafe(email: string): Promise<{
  user: User | null;
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionEnd: true,
      trialEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    return {
      user: null,
      hasActiveSubscription: false,
      subscriptionStatus: null,
    };
  }

  // アクティブなサブスクリプションかチェック
  const now = new Date();
  const hasActiveSubscription =
    user.subscriptionStatus === "active" ||
    user.subscriptionStatus === "trialing" ||
    user.subscriptionStatus === "lifetime" ||
    (user.subscriptionEnd !== null && new Date(user.subscriptionEnd) > now) ||
    (user.trialEnd !== null && new Date(user.trialEnd) > now);

  return {
    user: user as User,
    hasActiveSubscription,
    subscriptionStatus: user.subscriptionStatus,
  };
}
