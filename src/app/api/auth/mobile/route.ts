import { validateRequestBody, withApiSecurity } from "@/lib/api-security";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { z } from "zod";

// ログインリクエストのバリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
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
    .setExpirationTime("30d") // 30日間有効
    .sign(secret);
}

// ログイン処理
async function handleLogin(req: NextRequest) {
  // リクエストボディの検証
  const validation = await validateRequestBody(req, loginSchema);
  if ("error" in validation) {
    return validation.error;
  }

  const { email, password } = validation.data;

  try {
    // 既存のCredentialsProviderロジックを再利用
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    // ユーザーが存在しない場合
    if (!user) {
      return createErrorResponse(
        "メールアドレスまたはパスワードが正しくありません",
        401
      );
    }

    // パスワード認証ユーザーの場合
    if (user.hashedPassword) {
      // メール認証が必要な場合のチェック
      if (user.primaryAuthMethod === "email" && !user.emailVerified) {
        return createErrorResponse("メールアドレスの確認が必要です", 401);
      }

      const isValid = await bcryptjs.compare(password, user.hashedPassword);
      if (!isValid) {
        return createErrorResponse(
          "メールアドレスまたはパスワードが正しくありません",
          401
        );
      }

      // JWTトークンを生成
      const token = await generateJWT({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      // ユーザー情報（パスワードは除外）
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
        message: "ログインが成功しました",
      });
    }

    // 外部認証ユーザーの場合
    if (user.accounts && user.accounts.length > 0) {
      const availableProviders = user.accounts.map(
        (account) => account.provider
      );
      return createErrorResponse(
        `このアカウントは${availableProviders.join("、")}でログインしてください`,
        400
      );
    }

    return createErrorResponse("ログインに失敗しました", 401);
  } catch (error) {
    console.error("Mobile login error:", error);
    return createErrorResponse("サーバーエラーが発生しました", 500);
  }
}

// POST: モバイルログイン
export const POST = withApiSecurity(handleLogin, {
  rateLimit: {
    limit: 10, // 1分間に10回まで
    windowMs: 60000,
  },
});
