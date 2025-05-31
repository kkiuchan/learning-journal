import { sendExpiryWarningNotification } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// 期間終了前の警告メールを送信
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // 7日後に期限切れのユーザー
    const expiringIn7Days = await prisma.user.findMany({
      where: {
        subscriptionStatus: "active",
        subscriptionPlan: "pro",
        subscriptionEnd: {
          gte: sevenDaysFromNow,
          lte: new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000), // 7日後の24時間以内
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionEnd: true,
      },
    });

    // 1日後に期限切れのユーザー
    const expiringIn1Day = await prisma.user.findMany({
      where: {
        subscriptionStatus: "active",
        subscriptionPlan: "pro",
        subscriptionEnd: {
          gte: oneDayFromNow,
          lte: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000), // 1日後の24時間以内
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionEnd: true,
      },
    });

    let notificationsSent = 0;

    // 7日前警告メール
    for (const user of expiringIn7Days) {
      if (user.subscriptionEnd) {
        await sendExpiryWarningNotification(
          user.email,
          user.name,
          7,
          user.subscriptionEnd
        );
        notificationsSent++;
        console.log(`7-day warning sent to ${user.email}`);
      }
    }

    // 1日前警告メール
    for (const user of expiringIn1Day) {
      if (user.subscriptionEnd) {
        await sendExpiryWarningNotification(
          user.email,
          user.name,
          1,
          user.subscriptionEnd
        );
        notificationsSent++;
        console.log(`1-day warning sent to ${user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      sevenDayWarnings: expiringIn7Days.length,
      oneDayWarnings: expiringIn1Day.length,
      totalNotifications: notificationsSent,
      message: `期間終了警告メールを${notificationsSent}件送信しました`,
    });
  } catch (error) {
    console.error("Expiry warning check error:", error);
    return NextResponse.json(
      { error: "期間終了警告メールの送信中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
