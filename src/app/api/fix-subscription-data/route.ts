import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const targetUserId = "cmbbjq9700000le0f9a9i6gja";

    console.log("🔧 Fixing subscription data for user:", targetUserId);

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    console.log("📋 Current user data:", {
      id: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      subscriptionStatus: user.subscriptionStatus,
    });

    // 無効なStripe参照をクリーンアップ
    const updateData = {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      subscriptionStatus: null,
      subscriptionPlan: null,
      subscriptionStart: null,
      subscriptionEnd: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    };

    await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    console.log("✅ Subscription data cleaned up successfully");

    // 更新後のユーザー情報を取得
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    return createApiResponse({
      message: "サブスクリプションデータをクリーンアップしました",
      before: user,
      after: updatedUser,
      nextSteps: [
        "ユーザーは新しいチェックアウトセッションを完了できます",
        "チェックアウト完了時に正しいサブスクリプションが作成されます",
        "7日間の無料トライアルが再度利用可能になります",
      ],
      checkoutSession: {
        id: "cs_live_a1x0ZwnU5Or3y0vThivIuMxWQawFRshzzibGvsbDj0TeURV1awgQhC34jr",
        status: "ready_for_completion",
        url: "https://checkout.stripe.com/c/pay/cs_live_a1x0ZwnU5Or3y0vThivIuMxWQawFRshzzibGvsbDj0TeURV1awgQhC34jr",
      },
    });
  } catch (error) {
    console.error("Subscription fix error:", error);
    return createErrorResponse(
      "サブスクリプションデータ修正中にエラーが発生しました",
      500
    );
  }
}
