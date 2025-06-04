import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 }
      );
    }

    // Prismaクライアントを使用してユーザー情報を取得
    const userData = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        primaryAuthMethod: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!userData) {
      // ユーザーが存在しない場合
      return NextResponse.json({
        exists: false,
        availableProviders: [],
      });
    }

    // OAuth認証プロバイダーを取得
    const availableProviders = userData.accounts.map(
      (account) => account.provider
    );

    // primaryAuthMethodがemailの場合はパスワード認証も利用可能
    if (userData.primaryAuthMethod === "email") {
      availableProviders.push("email");
    }

    return NextResponse.json({
      exists: true,
      availableProviders,
      primaryAuthMethod: userData.primaryAuthMethod,
    });
  } catch (error) {
    console.error("メールアドレス確認API エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
