import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 環境変数の確認
    const envCheck = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "設定済み" : "未設定",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "未設定",
      SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "未設定",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "未設定",
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      status: "success",
      environment: envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      "noreply@learning-journal-app.com";

    // テストメール送信
    const testEmailResult = await resend.emails.send({
      from: "Learning Journal <noreply@learning-journal-app.com>",
      to: [adminEmail],
      subject: "【テスト】お問い合わせフォーム - 本番環境テスト",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #333;">本番環境メール送信テスト</h1>
          <p>このメールは、本番環境でのお問い合わせフォーム機能のテストとして送信されました。</p>
          
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0;">環境情報</h3>
            <p style="margin: 0; font-size: 14px;">
              <strong>送信時刻:</strong> ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}<br>
              <strong>環境:</strong> ${process.env.NODE_ENV}<br>
              <strong>送信先:</strong> ${adminEmail}
            </p>
          </div>
          
          <p>このメールが正常に届いている場合、Resend API とメール送信機能は正常に動作しています。</p>
        </div>
      `,
    });

    return NextResponse.json({
      status: "success",
      message: "テストメールを送信しました",
      emailId: testEmailResult.data?.id,
      recipient: adminEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test email send error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
