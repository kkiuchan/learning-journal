import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// メール送信の共通設定
const EMAIL_CONFIG = {
  from: "Learning Journal <noreply@learning-journal-app.com>",
  replyTo: process.env.SUPPORT_EMAIL || "noreply@learning-journal-app.com",
};

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "メールアドレスは必須です" } },
        { status: 400 }
      );
    }

    const supportEmail =
      process.env.SUPPORT_EMAIL || "noreply@learning-journal-app.com";

    const data = await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [email],
      subject: "Learning Journal - テストメール",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <h1 style="color: #333;">Learning Journal テストメール</h1>
          <p>このメールは、Learning Journalのメール送信機能のテストとして送信されました。</p>
          <p>メール送信が正常に機能していることを確認できました。</p>
          
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #495057;">メール設定情報</h3>
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              <strong>送信者:</strong> ${EMAIL_CONFIG.from}<br>
              <strong>返信先:</strong> ${EMAIL_CONFIG.replyTo}
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          
          <p style="font-size: 14px; color: #6c757d;">
            ※ このメールは自動送信されています。<br>
            ご質問やお問い合わせがございましたら、<a href="mailto:${supportEmail}" style="color: #007bff;">${supportEmail}</a> までご連絡ください。
          </p>
        </div>
      `,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("メール送信エラー:", error);
    return NextResponse.json(
      { error: { message: "メール送信に失敗しました" } },
      { status: 500 }
    );
  }
}
