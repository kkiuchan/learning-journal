import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "メールアドレスは必須です" } },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      from: "Learning Journal <noreply@learning-journal-app.com>",
      to: [email],
      subject: "Learning Journal - テストメール",
      html: `
        <h1>Learning Journal テストメール</h1>
        <p>このメールは、Learning Journalのメール送信機能のテストとして送信されました。</p>
        <p>メール送信が正常に機能していることを確認できました。</p>
        <hr>
        <p>※ このメールは自動送信されています。返信はできませんのでご了承ください。</p>
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
