import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 環境変数の存在確認
    const envCheck = {
      STRIPE_SECRET_KEY: {
        exists: !!process.env.STRIPE_SECRET_KEY,
        type: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
          ? "LIVE"
          : process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
            ? "TEST"
            : "UNKNOWN",
        masked: process.env.STRIPE_SECRET_KEY
          ? `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.substring(-4)}`
          : null,
      },
      STRIPE_PUBLISHABLE_KEY: {
        exists: !!process.env.STRIPE_PUBLISHABLE_KEY,
        type: process.env.STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_")
          ? "LIVE"
          : process.env.STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_")
            ? "TEST"
            : "UNKNOWN",
        masked: process.env.STRIPE_PUBLISHABLE_KEY
          ? `${process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...${process.env.STRIPE_PUBLISHABLE_KEY.substring(-4)}`
          : null,
      },
      STRIPE_WEBHOOK_SECRET: {
        exists: !!process.env.STRIPE_WEBHOOK_SECRET,
        type: process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")
          ? "VALID_FORMAT"
          : "UNKNOWN",
        masked: process.env.STRIPE_WEBHOOK_SECRET
          ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...`
          : null,
      },
      STRIPE_PRO_PRICE_ID: {
        exists: !!process.env.STRIPE_PRO_PRICE_ID,
        type: process.env.STRIPE_PRO_PRICE_ID?.startsWith("price_")
          ? "VALID_FORMAT"
          : "UNKNOWN",
        masked: process.env.STRIPE_PRO_PRICE_ID
          ? `${process.env.STRIPE_PRO_PRICE_ID.substring(0, 8)}...`
          : null,
      },
    };

    // 環境情報
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === "production",
      hasAllStripeKeys:
        envCheck.STRIPE_SECRET_KEY.exists &&
        envCheck.STRIPE_PUBLISHABLE_KEY.exists &&
        envCheck.STRIPE_WEBHOOK_SECRET.exists &&
        envCheck.STRIPE_PRO_PRICE_ID.exists,
    };

    // 整合性チェック
    const consistencyCheck = {
      keysMatchEnvironment:
        envCheck.STRIPE_SECRET_KEY.type ===
        envCheck.STRIPE_PUBLISHABLE_KEY.type,
      expectedKeyType: environment.isProduction ? "LIVE" : "TEST",
      actualKeyType: envCheck.STRIPE_SECRET_KEY.type,
      isConsistent: environment.isProduction
        ? envCheck.STRIPE_SECRET_KEY.type === "LIVE"
        : envCheck.STRIPE_SECRET_KEY.type === "TEST",
    };

    // 警告とエラー
    const warnings = [];
    const errors = [];

    if (!environment.hasAllStripeKeys) {
      errors.push("必要なStripe環境変数が不足しています");
    }

    if (!consistencyCheck.keysMatchEnvironment) {
      errors.push(
        "STRIPE_SECRET_KEYとSTRIPE_PUBLISHABLE_KEYの環境が一致しません"
      );
    }

    if (!consistencyCheck.isConsistent) {
      if (environment.isProduction) {
        errors.push("本番環境なのにテスト用のStripeキーが設定されています");
      } else {
        warnings.push("開発環境なのに本番用のStripeキーが設定されています");
      }
    }

    // レスポンス
    return createApiResponse({
      status:
        errors.length > 0 ? "ERROR" : warnings.length > 0 ? "WARNING" : "OK",
      environment,
      envCheck,
      consistencyCheck,
      warnings,
      errors,
      recommendations: [
        "本番環境移行前にすべての環境変数を確認してください",
        "テスト環境と本番環境でキーが正しく設定されているか確認してください",
        "Webhookエンドポイントが正しく設定されているか確認してください",
      ],
    });
  } catch (error) {
    console.error("環境チェックエラー:", error);
    return createErrorResponse("環境チェックに失敗しました", 500);
  }
}
