"use server";
"use server";

import { prisma } from "@/lib/prisma";
import { userRegistrationSchema } from "@/validation/user";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

// 仮の関数：メール/パスワードによるユーザー登録処理
async function createUserWithEmailAndPassword(email: string, password: string) {
  // ここでデータベースへの登録や認証サービスのAPI呼び出しを実施します
  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword: await bcrypt.hash(password, 10),
      primaryAuthMethod: "email",
      name: email.split("@")[0], // デフォルトの名前としてメールアドレスのローカル部分を使用
    },
  });
  // 実装例として、生成されたユーザーIDとメールを返す
  return { id: user.id, email };
}

// 仮の関数：外部認証によるユーザー登録処理
async function createUserWithOAuth(provider: string, email: string) {
  // providerに応じたOAuthフローを実施し、ユーザー情報を取得します
  const user = await prisma.user.create({
    data: {
      email,
      primaryAuthMethod: provider,
      name: email.split("@")[0], // デフォルトの名前としてメールアドレスのローカル部分を使用
    },
  });
  return { id: user.id, email, provider };
}

// サーバーアクションとしてのユーザー登録処理
export async function registerUser(formData: FormData) {
  // フォームデータから各項目を取得
  const email = formData.get("email") as string;
  const password = formData.get("password") as string | null;
  const provider = formData.get("provider") as string | null;

  // Zodによる入力検証
  const parseResult = userRegistrationSchema.safeParse({
    email,
    password: password || undefined,
    provider: provider || undefined,
  });

  if (!parseResult.success) {
    // バリデーションエラーの場合、400ステータスでエラー内容を返す
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    let user;
    if (parseResult.data.provider) {
      // 外部認証の場合はproviderが指定されているので、OAuthフローを実行
      user = await createUserWithOAuth(
        parseResult.data.provider,
        parseResult.data.email
      );
    } else {
      // メール/パスワード登録の場合はパスワードが必須
      if (!parseResult.data.password) {
        return NextResponse.json(
          { errors: { password: ["パスワードは必須です"] } },
          { status: 400 }
        );
      }
      user = await createUserWithEmailAndPassword(
        parseResult.data.email,
        parseResult.data.password
      );
    }
    // 正常にユーザー登録が完了した場合、ユーザー情報を返す
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    // 登録処理中にエラーが発生した場合のエラーハンドリング
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}

export async function updateUser(
  userId: number,
  data: Partial<{
    name: string;
    email: string;
    hashedPassword: string;
    subscriptionStatus: string;
    subscriptionPlan: string;
    subscriptionStart: Date;
    subscriptionEnd: Date;
  }>
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return user;
}

export async function deleteUser(userId: number) {
  const user = await prisma.user.delete({
    where: { id: userId },
  });
  return user;
}
