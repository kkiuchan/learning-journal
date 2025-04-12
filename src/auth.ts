export const runtime = "edge";

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// 開発環境と本番環境で適切なシークレットを使用
const secret = process.env.NEXTAUTH_SECRET;

if (!secret) {
  throw new Error("Authentication secret is not set");
}

//handlerのみの戻り値らしい signIn, signOutはないから、どうしたらいいのか
export const handler = NextAuth({
  ...authConfig,
  secret,
});

export const GET = handler;
export const POST = handler;
