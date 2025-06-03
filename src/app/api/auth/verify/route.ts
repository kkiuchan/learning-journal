import { withApiSecurity } from "@/lib/api-security";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

// JWT用の秘密鍵
const getJwtSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

// JWTトークンの検証
async function verifyJWT(token: string) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// トークン検証処理
async function handleVerify(req: NextRequest) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createErrorResponse("トークンが見つかりません", 401);
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    // JWTトークンを検証
    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return createErrorResponse("無効なトークンです", 401);
    }

    // データベースからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        primaryAuthMethod: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    return createApiResponse({
      user,
      isValid: true,
      message: "トークンは有効です",
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return createErrorResponse("トークンの検証に失敗しました", 500);
  }
}

// GET: トークン検証
export const GET = withApiSecurity(handleVerify, {
  rateLimit: {
    limit: 30, // 1分間に30回まで
    windowMs: 60000,
  },
});
