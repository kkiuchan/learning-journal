import { isProduction, stripe, stripeEnvironment } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const configInfo = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction,
        stripeEnvironment,
      },
      keys: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        hasProPriceId: !!process.env.STRIPE_PRO_PRICE_ID,
        secretKeyType: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
          ? "LIVE"
          : "TEST",
        publicKeyType:
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_")
            ? "LIVE"
            : "TEST",
      },
      stripe: {
        initialized: !!stripe,
        version: "2025-05-28.basil", // stripe.apiVersion は存在しないため固定値
      },
      timestamp: new Date().toISOString(),
    };

    // Stripeアカウント情報をテスト取得
    let accountInfo = null;
    if (stripe) {
      try {
        const account = await stripe.accounts.retrieve();
        accountInfo = {
          id: account.id,
          country: account.country,
          defaultCurrency: account.default_currency,
          detailsSubmitted: account.details_submitted,
          payoutsEnabled: account.payouts_enabled,
          chargesEnabled: account.charges_enabled,
        };
      } catch (error) {
        console.error("Stripe account retrieve error:", error);
        accountInfo = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({
      message: "Stripe設定確認完了",
      config: configInfo,
      account: accountInfo,
      recommendations: [
        "🔧 開発環境ではテストモード（サンドボックス）が適用されます",
        "💳 テスト用のクレジットカード番号（4242 4242 4242 4242）で決済テスト可能",
        "📧 テスト環境では実際の課金は発生しません",
        "🔄 本番環境では LIVE キーに変更が必要です",
      ],
    });
  } catch (error) {
    console.error("Stripe設定確認エラー:", error);
    return NextResponse.json(
      {
        error: "設定確認中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
