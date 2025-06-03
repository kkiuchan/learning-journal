import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// JWT設定
const JWT_SECRET = process.env.NEXTAUTH_SECRET;
const JWT_EXPIRES_IN = "24h";

if (!JWT_SECRET) {
  throw new Error("JWT secret is not configured");
}

/**
 * @swagger
 * /api/auth/mobile-login:
 *   post:
 *     summary: モバイルアプリ用ログイン
 *     description: React Nativeアプリからのログイン認証を処理し、JWTトークンを返します
 *     tags: [認証]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: メールアドレス
 *               password:
 *                 type: string
 *                 description: パスワード
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: ログイン成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWTアクセストークン
 *       400:
 *         description: リクエストエラー
 *       401:
 *         description: 認証失敗
 *       500:
 *         description: サーバーエラー
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // バリデーション
    if (!email || !password) {
      return createErrorResponse("メールアドレスとパスワードは必須です", 400);
    }

    // ユーザーの検索
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 401);
    }

    // パスワード認証ユーザーの場合
    if (user.hashedPassword) {
      // メール認証チェック
      if (user.primaryAuthMethod === "email" && !user.emailVerified) {
        return createErrorResponse("メールアドレスの確認が必要です", 401);
      }

      // パスワード検証
      const isValid = await bcryptjs.compare(password, user.hashedPassword);
      if (!isValid) {
        return createErrorResponse("パスワードが正しくありません", 401);
      }

      // JWTトークン生成
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        primaryAuthMethod: user.primaryAuthMethod,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET as string, {
        expiresIn: JWT_EXPIRES_IN,
      });

      // レスポンス用ユーザーデータ（パスワードを除外）
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        topImage: user.topImage,
        age: user.age,
        ageVisible: user.ageVisible,
        primaryAuthMethod: user.primaryAuthMethod,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStart: user.subscriptionStart?.toISOString() || null,
        subscriptionEnd: user.subscriptionEnd?.toISOString() || null,
        trialEnd: user.trialEnd?.toISOString() || null,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        canceledAt: user.canceledAt?.toISOString() || null,
        emailVerified: user.emailVerified?.toISOString() || null,
        selfIntroduction: user.selfIntroduction,
      };

      return createApiResponse({
        user: userData,
        token: token,
      });
    }

    // 外部認証ユーザーの場合
    if (user.accounts && user.accounts.length > 0) {
      const availableProviders = user.accounts.map(
        (account) => account.provider
      );
      return createErrorResponse(
        `このアカウントは${availableProviders.join(", ")}でログインしてください`,
        401
      );
    }

    return createErrorResponse("認証方法が設定されていません", 401);
  } catch (error) {
    console.error("Mobile login error:", error);
    return createErrorResponse("ログインに失敗しました", 500);
  }
}
