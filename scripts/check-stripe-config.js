#!/usr/bin/env node

/**
 * Stripe設定確認スクリプト
 * 本番環境移行前の設定チェック用
 */

const dotenv = require("dotenv");
const path = require("path");

// 環境変数を読み込み
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

function checkStripeConfig() {
  console.log("🔍 Stripe設定確認を開始します...\n");

  const config = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  };

  let hasErrors = false;
  let hasWarnings = false;

  console.log("📋 環境変数チェック:");
  console.log("=".repeat(50));

  // 各環境変数をチェック
  Object.entries(config).forEach(([key, value]) => {
    const exists = !!value;

    let keyType = "UNKNOWN";
    if (key === "STRIPE_SECRET_KEY") {
      keyType = value?.startsWith("sk_live_")
        ? "LIVE"
        : value?.startsWith("sk_test_")
          ? "TEST"
          : "UNKNOWN";
    } else if (key === "STRIPE_PUBLISHABLE_KEY") {
      keyType = value?.startsWith("pk_live_")
        ? "LIVE"
        : value?.startsWith("pk_test_")
          ? "TEST"
          : "UNKNOWN";
    } else if (key === "STRIPE_WEBHOOK_SECRET") {
      keyType = value?.startsWith("whsec_") ? "VALID" : "INVALID";
    } else if (key === "STRIPE_PRO_PRICE_ID") {
      keyType = value?.startsWith("price_") ? "VALID" : "INVALID";
    }

    const status = exists ? "✅" : "❌";
    const maskedValue = value
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : "なし";

    console.log(`${status} ${key}: ${keyType} (${maskedValue})`);

    if (!exists) {
      hasErrors = true;
    }
  });

  console.log("\n" + "=".repeat(50));

  // 整合性チェック
  console.log("\n🔧 整合性チェック:");
  console.log("=".repeat(50));

  const secretKeyType = config.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    ? "LIVE"
    : "TEST";
  const pubKeyType = config.STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_")
    ? "LIVE"
    : "TEST";

  if (config.STRIPE_SECRET_KEY && config.STRIPE_PUBLISHABLE_KEY) {
    if (secretKeyType === pubKeyType) {
      console.log(`✅ キー環境一致: ${secretKeyType}環境`);
    } else {
      console.log(
        `❌ キー環境不一致: SECRET=${secretKeyType}, PUBLISHABLE=${pubKeyType}`
      );
      hasErrors = true;
    }
  } else {
    console.log("❌ キー不足のため整合性チェック不可");
    hasErrors = true;
  }

  // 環境判定
  const isProduction = process.env.NODE_ENV === "production";
  const expectedKeyType = isProduction ? "LIVE" : "TEST";

  console.log(`\n📍 現在の環境: ${process.env.NODE_ENV || "development"}`);
  console.log(`📍 期待するキー: ${expectedKeyType}`);
  console.log(`📍 実際のキー: ${secretKeyType}`);

  if (isProduction && secretKeyType !== "LIVE") {
    console.log("⚠️  本番環境でテスト用キーが設定されています");
    hasWarnings = true;
  } else if (!isProduction && secretKeyType === "LIVE") {
    console.log("⚠️  開発環境で本番用キーが設定されています");
    hasWarnings = true;
  } else {
    console.log("✅ 環境とキータイプが一致しています");
  }

  // 結果表示
  console.log("\n" + "=".repeat(50));
  console.log("📊 チェック結果:");
  console.log("=".repeat(50));

  if (hasErrors) {
    console.log("❌ エラーがあります。設定を確認してください。");
  } else if (hasWarnings) {
    console.log("⚠️  警告があります。設定を確認してください。");
  } else {
    console.log("✅ すべての設定が正常です。");
  }

  // 本番環境移行時の注意事項
  if (!isProduction) {
    console.log("\n📖 本番環境移行時の手順:");
    console.log("=".repeat(50));
    console.log("1. Stripeダッシュボードで本番環境に切り替え");
    console.log("2. 商品・価格を作成してPrice IDを取得");
    console.log("3. Webhookエンドポイントを設定");
    console.log("4. 本番用APIキーを取得");
    console.log("5. 環境変数を本番用に更新");
    console.log("6. Vercelで本番環境変数を設定");
    console.log("7. テスト決済で動作確認");
    console.log("\n詳細は docs/stripe-production-migration.md を参照");
  }

  console.log("\n✨ チェック完了\n");

  // 終了コード
  process.exit(hasErrors ? 1 : 0);
}

// スクリプト実行
checkStripeConfig();
