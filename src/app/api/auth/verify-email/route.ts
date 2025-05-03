import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// メール確認メールを送信
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "メールアドレスは必須です" } },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "ユーザーが見つかりません" } },
        { status: 404 }
      );
    }

    // すでに確認済みの場合
    if (user.emailVerified) {
      return NextResponse.json(
        { error: { message: "すでにメール確認済みです" } },
        { status: 400 }
      );
    }

    // 確認トークンの生成
    const token = nanoid();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24時間後に期限切れ

    // 既存の確認トークンを削除
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 新しい確認トークンを保存
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // 確認メールの送信
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
    await resend.emails.send({
      from: "Learning Journal <noreply@learning-journal-app.com>",
      to: [email],
      subject: "Learning Journal - メールアドレスの確認",
      html: `
        <h1>メールアドレスの確認</h1>
        <p>以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>
        <p>このリンクは24時間後に期限切れとなります。</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
          メールアドレスを確認する
        </a>
        <p style="margin-top: 20px;">※ このメールに心当たりがない場合は、無視していただいて構いません。</p>
      `,
    });

    return NextResponse.json({ message: "確認メールを送信しました" });
  } catch (error) {
    console.error("メール確認エラー:", error);
    return NextResponse.json(
      { error: { message: "確認メールの送信に失敗しました" } },
      { status: 500 }
    );
  }
}

// メールアドレスの確認処理
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: { message: "トークンが必要です" } },
        { status: 400 }
      );
    }

    // トークンの検証
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: { message: "無効なトークンです" } },
        { status: 400 }
      );
    }

    // ユーザーのメール確認状態を更新
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // 使用済みトークンを削除
    await prisma.verificationToken.delete({
      where: { token: verificationToken.token },
    });

    return NextResponse.json({ message: "メールアドレスの確認が完了しました" });
  } catch (error) {
    console.error("メール確認エラー:", error);
    return NextResponse.json(
      { error: { message: "メールアドレスの確認に失敗しました" } },
      { status: 500 }
    );
  }
}
