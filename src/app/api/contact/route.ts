import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// お問い合わせフォームバリデーションスキーマ
const contactSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  subject: z.string().min(1, "件名を入力してください"),
  category: z.enum(["general", "technical", "billing", "feature"]),
  message: z.string().min(10, "お問い合わせ内容は10文字以上入力してください"),
});

// カテゴリ名の日本語表記
const categoryLabels = {
  general: "一般的なお問い合わせ",
  technical: "技術的な問題",
  billing: "請求・支払いについて",
  feature: "機能追加のご提案",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validatedData = contactSchema.parse(body);
    const { name, email, subject, category, message } = validatedData;

    // 管理者用メールアドレス（環境変数から取得）
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      "noreply@learning-journal-app.com";

    // 現在時刻
    const timestamp = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 管理者への通知メール
    const adminEmailData = {
      from: "Learning Journal <noreply@learning-journal-app.com>",
      to: [adminEmail],
      replyTo: email, // 返信先をお客様のメールアドレスに設定
      subject: `【お問い合わせ】${subject}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #495057; margin: 0 0 16px 0; font-size: 20px;">
              📧 新しいお問い合わせが届きました
            </h1>
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              受信日時: ${timestamp}
            </p>
          </div>
          
          <div style="background-color: white; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #007bff; color: white; padding: 16px;">
              <h2 style="margin: 0; font-size: 18px;">お問い合わせ詳細</h2>
            </div>
            
            <div style="padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 12px 0; font-weight: bold; color: #495057; width: 120px;">お名前</td>
                  <td style="padding: 12px 0; color: #212529;">${name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 12px 0; font-weight: bold; color: #495057;">メールアドレス</td>
                  <td style="padding: 12px 0; color: #212529;">
                    <a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 12px 0; font-weight: bold; color: #495057;">カテゴリ</td>
                  <td style="padding: 12px 0; color: #212529;">${categoryLabels[category]}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 12px 0; font-weight: bold; color: #495057;">件名</td>
                  <td style="padding: 12px 0; color: #212529;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: bold; color: #495057; vertical-align: top;">お問い合わせ内容</td>
                  <td style="padding: 12px 0; color: #212529; white-space: pre-wrap;">${message}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #0c5460; font-size: 16px;">📝 返信について</h3>
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              このメールに直接返信することで、お客様（${email}）に返信できます。<br>
              通常1〜2営業日以内にご返信をお願いします。
            </p>
          </div>
          
          <div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
              このメールは Learning Journal のお問い合わせフォームから自動送信されています。<br>
              お問い合わせ管理: <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color: #007bff;">管理画面</a>
            </p>
          </div>
        </div>
      `,
    };

    // お客様への自動返信メール
    const customerEmailData = {
      from: "Learning Journal サポート <noreply@learning-journal-app.com>",
      to: [email],
      replyTo: adminEmail, // 返信先を管理者メールアドレスに設定
      subject: `【Learning Journal】お問い合わせを承りました - ${subject}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #155724; margin: 0 0 16px 0; font-size: 20px;">
              ✅ お問い合わせありがとうございます
            </h1>
            <p style="margin: 0; color: #155724;">
              ${name} 様のお問い合わせを正常に受付いたしました。
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px; margin: 0 0 16px 0;">受付内容の確認</h2>
            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold; color: #495057; width: 120px;">受付日時</td>
                  <td style="padding: 8px 0; color: #212529;">${timestamp}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">カテゴリ</td>
                  <td style="padding: 8px 0; color: #212529;">${categoryLabels[category]}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">件名</td>
                  <td style="padding: 8px 0; color: #212529;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057; vertical-align: top;">お問い合わせ内容</td>
                  <td style="padding: 8px 0; color: #212529; white-space: pre-wrap;">${message}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #856404; font-size: 16px;">📞 今後の流れ</h3>
            <ul style="margin: 8px 0 0 0; color: #856404; padding-left: 20px;">
              <li>通常1〜2営業日以内にご返信いたします</li>
              <li>お急ぎの場合は、お問い合わせ内容に「急用」とご記載ください</li>
              <li>技術的な問題の場合、追加情報をお尋ねする場合があります</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Learning Journal へ戻る
            </a>
          </div>
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 20px;">
            <p style="margin: 0 0 8px 0;">
              <strong>Learning Journal サポートチーム</strong><br>
              ${adminEmail}
            </p>
            <p style="margin: 0; font-size: 12px;">
              ※ このメールは自動送信されています。このメールに返信いただくことで、サポートチームに直接連絡できます。
            </p>
          </div>
        </div>
      `,
    };

    // メール送信実行
    const [adminResult, customerResult] = await Promise.all([
      resend.emails.send(adminEmailData),
      resend.emails.send(customerEmailData),
    ]);

    console.log("Contact form emails sent:", {
      adminEmailId: adminResult.data?.id,
      customerEmailId: customerResult.data?.id,
      recipient: email,
      category,
      subject,
    });

    return NextResponse.json({
      success: true,
      message: "お問い合わせを正常に送信しました",
      emailIds: {
        admin: adminResult.data?.id,
        customer: customerResult.data?.id,
      },
    });
  } catch (error) {
    console.error("Contact form submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: "入力内容に不備があります",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "お問い合わせの送信中にエラーが発生しました",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
