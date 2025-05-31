import { sendPaymentFailedNotification } from "@/lib/email-templates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "メールアドレスは必須です" } },
        { status: 400 }
      );
    }

    // テスト用の支払い失敗データ
    const testAmount = 68000; // 680円を銭単位で（実際の課金額）
    const testCurrency = "jpy";

    // 支払い失敗メールを送信
    await sendPaymentFailedNotification(
      email,
      name || "テストユーザー",
      testAmount,
      testCurrency
    );

    return NextResponse.json({
      success: true,
      message: "支払い失敗通知メールを送信しました",
      details: {
        recipient: email,
        amount: `¥${(testAmount / 100).toLocaleString()}`,
        currency: testCurrency,
      },
    });
  } catch (error) {
    console.error("支払い失敗メール送信エラー:", error);
    return NextResponse.json(
      { error: { message: "メール送信に失敗しました" } },
      { status: 500 }
    );
  }
}
