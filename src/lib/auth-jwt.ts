import jwt from "jsonwebtoken";
import { headers } from "next/headers";

// JWT検証のユーザー型
export interface JWTUser {
  sub: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
  iat: number;
  exp: number;
}

// リクエストからJWTを取得・検証
export async function verifyJWT(): Promise<JWTUser | null> {
  try {
    const headersList = await headers();
    const authorization = headersList.get("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return null;
    }

    const token = authorization.replace("Bearer ", "");
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as JWTUser;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// JWTユーザーの取得（認証必須）
export async function requireJWTAuth(): Promise<JWTUser> {
  const user = await verifyJWT();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}
