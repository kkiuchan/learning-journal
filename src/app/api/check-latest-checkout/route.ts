import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    if (!stripe) {
      return createErrorResponse("Stripe設定エラー", 500);
    }

    // 指定されたチェックアウトセッションの詳細を取得
    const sessionId =
      "cs_live_a1x0ZwnU5Or3y0vThivIuMxWQawFRshzzibGvsbDj0TeURV1awgQhC34jr";

    console.log("🔍 Checking checkout session:", sessionId);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const sessionData = {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
      metadata: session.metadata,
      success_url: session.success_url,
      cancel_url: session.cancel_url,
    };

    console.log("📋 Session data:", sessionData);

    // サブスクリプションが作成されている場合、その詳細を取得
    let subscriptionData = null;
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const sub = subscription as any;
        subscriptionData = {
          id: sub.id,
          status: sub.status,
          customer: sub.customer,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          trial_end: sub.trial_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          items: sub.items.data.map((item: any) => ({
            priceId: item.price.id,
            productId: item.price.product,
          })),
        };
        console.log("📊 Subscription data:", subscriptionData);
      } catch (error) {
        console.error("Subscription retrieval error:", error);
        subscriptionData = { error: (error as Error).message };
      }
    }

    // カスタマー情報も取得
    let customerData = null;
    if (session.customer) {
      try {
        const customer = await stripe.customers.retrieve(
          session.customer as string
        );
        customerData = {
          id: customer.id,
          email: (customer as any).email,
          created: (customer as any).created,
        };
        console.log("👤 Customer data:", customerData);
      } catch (error) {
        console.error("Customer retrieval error:", error);
        customerData = { error: (error as Error).message };
      }
    }

    return createApiResponse({
      checkoutSession: sessionData,
      subscription: subscriptionData,
      customer: customerData,
      analysis: {
        isCompleted: session.status === "complete",
        hasSubscription: !!session.subscription,
        hasCustomer: !!session.customer,
        recommendation:
          session.status === "complete" && session.subscription
            ? "新しいサブスクリプションが作成されています。データベースを更新する必要があります。"
            : "チェックアウトが完了していないか、サブスクリプションが作成されていません。",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Checkout session check error:", error);
    return createErrorResponse(
      "チェックアウトセッション確認中にエラーが発生しました",
      500
    );
  }
}
