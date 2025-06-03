import { validateRequestBody, withApiSecurity } from "@/lib/api-security";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { z } from "zod";

// GitHub OAuth リクエストのバリデーションスキーマ
const githubOAuthSchema = z.object({
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

// GitHubからアクセストークンを取得
async function getGitHubAccessToken(code: string, redirectUri: string) {
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error("GitHubトークンの取得に失敗しました");
  }

  return await tokenResponse.json();
}

// GitHubからユーザー情報を取得
async function getGitHubUserInfo(accessToken: string) {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "LearningJournal-Mobile",
    },
  });

  if (!userResponse.ok) {
    throw new Error("GitHubユーザー情報の取得に失敗しました");
  }

  const user = await userResponse.json();

  // GitHubのメールアドレスを取得（プライベートの場合は別途取得）
  if (!user.email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "LearningJournal-Mobile",
      },
    });

    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary);
      user.email = primaryEmail?.email || emails[0]?.email;
    }
  }

  return user;
}

// GitHub OAuth処理
async function handleGitHubOAuth(req: NextRequest) {
  // リクエストボディの検証
  const validation = await validateRequestBody(req, githubOAuthSchema);
  if ("error" in validation) {
    return validation.error;
  }

  const { code, redirectUri } = validation.data;

  try {
    // GitHubからアクセストークンを取得
    const tokenData = await getGitHubAccessToken(code, redirectUri);

    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
    }

    // GitHubからユーザー情報を取得
    const githubUser = await getGitHubUserInfo(tokenData.access_token);

    if (!githubUser.email) {
      return createErrorResponse(
        "GitHubのメールアドレスが取得できませんでした",
        400
      );
    }

    // 既存のユーザーを検索
    const existingUser = await prisma.user.findUnique({
      where: { email: githubUser.email },
      include: {
        accounts: true,
      },
    });

    let user;

    if (existingUser) {
      // 既存ユーザーの場合、GitHubアカウントが紐づいているかチェック
      const hasGitHubAccount = existingUser.accounts.some(
        (acc) => acc.provider === "github"
      );

      if (!hasGitHubAccount) {
        // GitHubアカウントを追加
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "github",
            providerAccountId: githubUser.id.toString(),
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
          },
        });
      }

      // 既存ユーザー情報を更新
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: githubUser.name || githubUser.login,
          image: githubUser.avatar_url,
          primaryAuthMethod: "github",
        },
      });
    } else {
      // 新規ユーザー作成
      user = await prisma.user.create({
        data: {
          name: githubUser.name || githubUser.login,
          email: githubUser.email,
          image: githubUser.avatar_url,
          primaryAuthMethod: "github",
          emailVerified: new Date(), // GitHubは既に認証済み
          accounts: {
            create: {
              type: "oauth",
              provider: "github",
              providerAccountId: githubUser.id.toString(),
              access_token: tokenData.access_token,
              token_type: tokenData.token_type,
              scope: tokenData.scope,
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
      message: "GitHubログインが成功しました",
    });
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return createErrorResponse("GitHub認証に失敗しました", 500);
  }
}

// POST: GitHub OAuth
export const POST = withApiSecurity(handleGitHubOAuth, {
  rateLimit: {
    limit: 5, // 1分間に5回まで
    windowMs: 60000,
  },
});
