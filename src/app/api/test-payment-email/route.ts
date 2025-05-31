import { sendPaymentSucceededNotification } from "@/lib/email-templates";
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

    // テスト用の支払いデータ
    const testAmount = 68000; // 680円を銭単位で（実際の課金額）
    const testReceiptUrl = "https://pay.stripe.com/receipts/test_receipt_123";

    // 支払い成功メールを送信
    await sendPaymentSucceededNotification(
      email,
      name || "テストユーザー",
      testAmount,
      testReceiptUrl
    );

    return NextResponse.json({
      success: true,
      message: "支払い成功通知メールを送信しました",
      details: {
        recipient: email,
        amount: `¥${(testAmount / 100).toLocaleString()}`,
        receiptUrl: testReceiptUrl,
      },
    });
  } catch (error) {
    console.error("支払い成功メール送信エラー:", error);
    return NextResponse.json(
      { error: { message: "メール送信に失敗しました" } },
      { status: 500 }
    );
  }
}
