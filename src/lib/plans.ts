// プラン定義とヘルパー関数（クライアントサイド対応）

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    name: "無料プラン",
    description: "基本的な学習記録機能",
    price: 0,
    currency: "jpy",
    interval: "month",
    features: [
      "学習ユニット 無制限",
      "学習ログ 無制限",
      "基本分析機能",
      "公開プロフィール",
    ],
    limits: {
      units: -1, // 無制限に変更
      logsPerMonth: -1, // 無制限に変更
      privateUnits: false,
      advancedAnalytics: false,
      dataExport: false,
      aiFeatures: false, // AI機能は無料プランでは利用不可
    },
  },
  PRO: {
    id: "pro",
    name: "プロプラン",
    description: "AI機能を含むフル機能プラン",
    price: 680,
    currency: "jpy",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_default", // 環境変数で設定
    features: [
      "学習ユニット 無制限",
      "学習ログ 無制限",
      "AIアドバイス機能 🤖",
      "AI学習サジェスト機能 ✨",
      "優先サポート",
      "7日間無料トライアル",
    ],
    limits: {
      units: -1, // -1 = 無制限
      logsPerMonth: -1,
      privateUnits: false, // 未実装のため無効
      advancedAnalytics: false, // 未実装のため無効
      dataExport: false, // 未実装のため無効
      aiFeatures: true, // AI機能はプロプランのみ
    },
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

// ユーザーの現在のプランを取得
export function getUserPlan(
  subscriptionStatus?: string | null,
  subscriptionPlan?: string | null
): PlanId {
  // ライフタイムプロプランの場合
  if (subscriptionStatus === "lifetime") {
    return "PRO";
  }

  // トライアル期間中は常にプロプラン（subscriptionPlanがnullでも）
  if (subscriptionStatus === "trialing") {
    return "PRO";
  }

  // 通常のプロプラン
  if (subscriptionStatus === "active" && subscriptionPlan === "pro") {
    return "PRO";
  }

  return "FREE";
}

// プランの制限チェック
export function checkPlanLimits(
  plan: PlanId,
  resource: string,
  currentCount: number
): boolean {
  const planLimits = SUBSCRIPTION_PLANS[plan].limits;

  switch (resource) {
    case "units":
      return planLimits.units === -1 || currentCount < planLimits.units;
    case "logsPerMonth":
      return (
        planLimits.logsPerMonth === -1 || currentCount < planLimits.logsPerMonth
      );
    case "aiFeatures":
      return planLimits.aiFeatures === true;
    default:
      return true;
  }
}
