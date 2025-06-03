import { validateRequestBody, withApiSecurity } from "@/lib/api-security";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { z } from "zod";

// Google OAuth リクエストのバリデーションスキーマ
const googleOAuthSchema = z.object({
  code: z.string().min(1, "認証コードが必要です"),
  redirectUri: z.string().url("有効なリダイレクトURIが必要です"),
});

// JWT用の秘密鍵
const getJwtSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

// JWTトークンの生成
async function generateJWT(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const secret = getJwtSecret();

  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

// Googleからアクセストークンを取得
async function getGoogleAccessToken(code: string, redirectUri: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Googleトークンの取得に失敗しました");
  }

  return await tokenResponse.json();
}

// Googleからユーザー情報を取得
async function getGoogleUserInfo(accessToken: string) {
  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!userResponse.ok) {
    throw new Error("Googleユーザー情報の取得に失敗しました");
  }

  return await userResponse.json();
}

// Google OAuth処理
async function handleGoogleOAuth(req: NextRequest) {
  // リクエストボディの検証
  const validation = await validateRequestBody(req, googleOAuthSchema);
  if ("error" in validation) {
    return validation.error;
  }

  const { code, redirectUri } = validation.data;

  try {
    // Googleからアクセストークンを取得
    const tokenData = await getGoogleAccessToken(code, redirectUri);

    // Googleからユーザー情報を取得
    const googleUser = await getGoogleUserInfo(tokenData.access_token);

    // 既存のユーザーを検索
    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: {
        accounts: true,
      },
    });

    let user;

    if (existingUser) {
      // 既存ユーザーの場合、Googleアカウントが紐づいているかチェック
      const hasGoogleAccount = existingUser.accounts.some(
        (acc) => acc.provider === "google"
      );

      if (!hasGoogleAccount) {
        // Googleアカウントを追加
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "google",
            providerAccountId: googleUser.id,
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
            expires_at: tokenData.expires_in
              ? Math.floor(Date.now() / 1000) + tokenData.expires_in
              : null,
          },
        });
      }

      // 既存ユーザー情報を更新
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: googleUser.name,
          image: googleUser.picture,
          primaryAuthMethod: "google",
        },
      });
    } else {
      // 新規ユーザー作成
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          image: googleUser.picture,
          primaryAuthMethod: "google",
          emailVerified: new Date(), // Googleは既に認証済み
          accounts: {
            create: {
              type: "oauth",
              provider: "google",
              providerAccountId: googleUser.id,
              access_token: tokenData.access_token,
              token_type: tokenData.token_type,
              scope: tokenData.scope,
              expires_at: tokenData.expires_in
                ? Math.floor(Date.now() / 1000) + tokenData.expires_in
                : null,
            },
          },
        },
      });
    }

    // JWTトークンを生成
    const token = await generateJWT({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // ユーザー情報
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      primaryAuthMethod: user.primaryAuthMethod,
      emailVerified: user.emailVerified,
    };

    return createApiResponse({
      user: userData,
      token,
      message: "Googleログインが成功しました",
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return createErrorResponse("Google認証に失敗しました", 500);
  }
}

// POST: Google OAuth
export const POST = withApiSecurity(handleGoogleOAuth, {
  rateLimit: {
    limit: 5, // 1分間に5回まで
    windowMs: 60000,
  },
});
