import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google アクセストークンが必要です" },
        { status: 400 }
      );
    }

    // Google API でユーザー情報を取得
    const googleResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );

    if (!googleResponse.ok) {
      return NextResponse.json(
        { error: "Google認証に失敗しました" },
        { status: 401 }
      );
    }

    const googleUser = await googleResponse.json();

    // 既存ユーザーを検索
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { accounts: true },
    });

    if (!user) {
      // 新規ユーザー作成
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          primaryAuthMethod: "google",
          emailVerified: new Date(),
          accounts: {
            create: {
              type: "oauth",
              provider: "google",
              providerAccountId: googleUser.id,
              access_token: accessToken,
              token_type: "Bearer",
              scope: "openid email profile",
            },
          },
        },
        include: { accounts: true },
      });
    } else {
      // Google アカウント情報を更新/追加
      const existingGoogleAccount = user.accounts.find(
        (account) => account.provider === "google"
      );

      if (!existingGoogleAccount) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider: "google",
            providerAccountId: googleUser.id,
            access_token: accessToken,
            token_type: "Bearer",
            scope: "openid email profile",
          },
        });
      } else {
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: googleUser.id,
            },
          },
          data: {
            access_token: accessToken,
          },
        });
      }

      // ユーザー情報を更新
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: googleUser.name,
          image: googleUser.picture,
          primaryAuthMethod: "google",
        },
        include: { accounts: true },
      });
    }

    // JWTトークンを生成
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        primaryAuthMethod: user.primaryAuthMethod,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        primaryAuthMethod: user.primaryAuthMethod,
      },
    });
  } catch (error) {
    console.error("Google認証エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
