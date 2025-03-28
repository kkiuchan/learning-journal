export const runtime = "nodejs";

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

//handlerのみの戻り値らしい signIn, signOutはないから、どうしたらいいのか
export const handler = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
});

export const GET = handler;
export const POST = handler;
