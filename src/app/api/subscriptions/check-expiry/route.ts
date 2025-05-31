import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// 期間終了したサブスクリプションをチェックして無効化
export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    // 期間が過ぎているアクティブなサブスクリプションを取得
    const expiredSubscriptions = await prisma.user.findMany({
      where: {
        subscriptionStatus: "active",
        subscriptionEnd: {
          lte: now, // 現在時刻以前に終了
        },
      },
      select: {
        id: true,
        email: true,
        subscriptionEnd: true,
        stripeSubscriptionId: true,
      },
    });

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // 期間終了したサブスクリプションを無効化
    for (const user of expiredSubscriptions) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "canceled",
          subscriptionPlan: null,
          subscriptionStart: null,
          subscriptionEnd: null,
        },
      });

      // サブスクリプション記録も更新
      if (user.stripeSubscriptionId) {
        await prisma.subscription.updateMany({
          where: { stripeId: user.stripeSubscriptionId },
          data: {
            status: "canceled",
          },
        });
      }

      console.log(
        `✅ Deactivated subscription for user ${user.email} (expired: ${user.subscriptionEnd})`
      );
    }

    return NextResponse.json({
      success: true,
      processed: expiredSubscriptions.length,
      message: `${expiredSubscriptions.length}件の期間終了サブスクリプションを無効化しました`,
    });
  } catch (error) {
    console.error("Subscription expiry check error:", error);
    return NextResponse.json(
      { error: "期間終了チェック中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
