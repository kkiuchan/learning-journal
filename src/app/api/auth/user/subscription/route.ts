import { getSupabaseServerUser } from "@/lib/auth-helpers";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authUser = await getSupabaseServerUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    // 完全なサブスクリプション情報を取得
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        trialEnd: true,
        cancelAtPeriodEnd: true,
        canceledAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const currentPlan = getUserPlan(
      user.subscriptionStatus,
      user.subscriptionPlan
    );

    // サブスクリプションが有効かどうかの判定
    const isActive =
      user.subscriptionStatus === "lifetime" ||
      (user.subscriptionStatus === "active" &&
        user.subscriptionEnd &&
        new Date(user.subscriptionEnd) > new Date()) ||
      (user.subscriptionStatus === "trialing" &&
        ((user.trialEnd && new Date(user.trialEnd) > new Date()) ||
          (user.subscriptionEnd &&
            new Date(user.subscriptionEnd) > new Date())));

    // キャンセル予約状態の確認
    const willCancelAtPeriodEnd =
      user.cancelAtPeriodEnd &&
      user.subscriptionEnd &&
      new Date(user.subscriptionEnd) > new Date();

    return NextResponse.json({
      success: true,
      data: {
        currentPlan,
        isActive,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStart: user.subscriptionStart
          ? user.subscriptionStart.toISOString()
          : null,
        subscriptionEnd: user.subscriptionEnd
          ? user.subscriptionEnd.toISOString()
          : null,
        trialEnd: user.trialEnd ? user.trialEnd.toISOString() : null,
        isLifetime: user.subscriptionStatus === "lifetime",
        hasStripeSubscription: !!user.stripeSubscriptionId,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        canceledAt: user.canceledAt ? user.canceledAt.toISOString() : null,
        willCancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { success: false, error: "サブスクリプション情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
