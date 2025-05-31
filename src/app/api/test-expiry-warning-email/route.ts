import { sendExpiryWarningNotification } from "@/lib/email-templates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name, daysUntilExpiry } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "メールアドレスは必須です" } },
        { status: 400 }
      );
    }

    // テスト用の期間終了データ
    const testDays = daysUntilExpiry || 7; // デフォルトは7日前
    const testExpiryDate = new Date();
    testExpiryDate.setDate(testExpiryDate.getDate() + testDays);

    // 期間終了前警告メールを送信
    await sendExpiryWarningNotification(
      email,
      name || "テストユーザー",
      testDays,
      testExpiryDate
    );

    return NextResponse.json({
      success: true,
      message: `期間終了前警告メール（${testDays}日前）を送信しました`,
      details: {
        recipient: email,
        daysUntilExpiry: testDays,
        expiryDate: testExpiryDate.toLocaleDateString("ja-JP"),
      },
    });
  } catch (error) {
    console.error("期間終了前警告メール送信エラー:", error);
    return NextResponse.json(
      { error: { message: "メール送信に失敗しました" } },
      { status: 500 }
    );
  }
}
