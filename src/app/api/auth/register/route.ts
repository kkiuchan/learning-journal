import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types";
import { authRequestSchema } from "@/types/auth";
import bcryptjs from "bcryptjs";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  await ensurePrismaConnected();
  try {
    console.log("登録リクエスト受信");
    const body = await request.json();
    console.log("リクエストボディ:", { ...body, password: "***" });

    const validatedData = authRequestSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      console.log("既存ユーザーが見つかりました:", validatedData.email);
      return createErrorResponse(
        "このメールアドレスは既に登録されています",
        400
      );
    }

    const hashedPassword = await bcryptjs.hash(validatedData.password, 10);

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        primaryAuthMethod: "email",
      },
    });
    console.log("ユーザー作成成功:", { id: user.id, email: user.email });

    // 確認トークンの生成
    const token = nanoid();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24時間後に期限切れ

    // 確認トークンを保存
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });
    console.log("確認トークン作成成功");

    // 確認メールの送信
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
    await resend.emails.send({
      from: "Learning Journal <noreply@learning-journal-app.com>",
      to: [user.email],
      subject: "Learning Journal - メールアドレスの確認",
      html: `
        <h1>ご登録ありがとうございます</h1>
        <p>Learning Journalへようこそ！</p>
        <p>以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>
        <p>このリンクは24時間後に期限切れとなります。</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
          メールアドレスを確認する
        </a>
        <p style="margin-top: 20px;">※ このメールに心当たりがない場合は、無視していただいて構いません。</p>
      `,
    });
    console.log("確認メール送信成功");

    const response = createApiResponse({
      message: "登録が完了しました。確認メールをご確認ください。",
    });
    console.log("レスポンス送信:", response);
    return response;
  } catch (error) {
    console.error("登録エラー:", error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0].message);
    }
    return createErrorResponse("登録中にエラーが発生しました", 500);
  }
}
