import { createApiResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 即時課金開始パターンのシミュレーション
    const mockStripeData = {
      // トライアルなしの場合
      noTrial: {
        id: "sub_example123",
        status: "active", // 即座にactive
        trial_end: null, // トライアルなし
        current_period_start: Math.floor(Date.now() / 1000), // 現在時刻
        current_period_end: Math.floor(
          (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000
        ), // 30日後
        cancel_at_period_end: false,
        canceled_at: null,
      },
      // トライアルありの場合（比較用）
      withTrial: {
        id: "sub_example456",
        status: "trialing", // トライアル中
        trial_end: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7日後
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(
          (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000
        ), // 7日後
        cancel_at_period_end: false,
        canceled_at: null,
      },
    };

    // データベース更新内容をシミュレーション
    const processData = (subData: any) => {
      const periodStart = subData.current_period_start
        ? new Date(subData.current_period_start * 1000)
        : new Date();
      const periodEnd = subData.current_period_end
        ? new Date(subData.current_period_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const trialEnd = subData.trial_end
        ? new Date(subData.trial_end * 1000)
        : null;

      return {
        subscriptionStatus: subData.status,
        subscriptionPlan: "pro",
        subscriptionStart: periodStart,
        subscriptionEnd: periodEnd,
        trialEnd: trialEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        stripeSubscriptionId: subData.id,
      };
    };

    const noTrialUpdate = processData(mockStripeData.noTrial);
    const withTrialUpdate = processData(mockStripeData.withTrial);

    return createApiResponse({
      message: "即時課金開始パターンのデータフロー検証",
      patterns: {
        "トライアル利用済み（即時課金開始）": {
          stripe: mockStripeData.noTrial,
          database: noTrialUpdate,
          description: "subscriptionStatusがactiveで即座に課金開始",
          features: [
            "✅ subscriptionStart: 現在時刻",
            "✅ subscriptionEnd: 30日後",
            "✅ trialEnd: null",
            "✅ subscriptionStatus: active",
            "✅ 即座にプロプラン機能利用可能",
          ],
        },
        "初回登録（トライアルあり）": {
          stripe: mockStripeData.withTrial,
          database: withTrialUpdate,
          description: "subscriptionStatusがtrialingで7日間無料",
          features: [
            "✅ subscriptionStart: 現在時刻",
            "✅ subscriptionEnd: 7日後",
            "✅ trialEnd: 7日後",
            "✅ subscriptionStatus: trialing",
            "✅ 7日間無料でプロプラン機能利用可能",
          ],
        },
      },
      comparison: {
        immediate_billing: {
          status: "active",
          trial_end: null,
          billing_starts: "immediately",
          user_experience: "即座に課金開始、プロプラン機能利用可能",
        },
        trial_billing: {
          status: "trialing",
          trial_end: "7 days",
          billing_starts: "after 7 days",
          user_experience: "7日間無料、その後課金開始",
        },
      },
    });
  } catch (error) {
    console.error("テストAPI エラー:", error);
    return createApiResponse({ error: "テストに失敗しました" });
  }
}
