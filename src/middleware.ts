import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 認証が不要なパス
const publicPaths = [
  "/auth/login",
  "/auth/signin",
  "/auth/register",
  "/auth/forgot-password",
  "/api/docs",
  "/_next",
  "/favicon.ico",
  "/sw.js",
  "/sw-register.js",
  "/manifest.json",
  "/offline.html",
  "/api/auth",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`[Edge] Request URL: ${request.url}`);
  console.log(`[Edge] Cookies:`, request.cookies.toString());

  // パスチェックを最適化
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    console.log(`[Edge] Public path access: ${pathname}`);
    return NextResponse.next();
  }

  try {
    // JWTトークンを手動で取得
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // 本番環境ではsecureCookieをtrueにする<=これがないとログインできないことに気づくために3日かかった
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: "next-auth.session-token",
    });

    console.log(`[Edge] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Edge] NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    console.log(`[Edge] Secret exists: ${!!process.env.NEXTAUTH_SECRET}`);
    console.log(`[Edge] Path: ${pathname}`);
    console.log(`[Edge] Token exists: ${!!token}`);
    if (token) {
      console.log(`[Edge] Token content:`, JSON.stringify(token, null, 2));
    }

    if (!token?.sub) {
      console.log(`[Edge] No valid token - redirecting to login`);
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // 管理者チェック
    const adminPaths = ["/admin"];
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

    if (isAdminPath && token.role !== "admin") {
      console.log(`[Edge] Non-admin access attempt to admin path`);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    console.log(`[Edge] Access granted to: ${pathname}`);
    return NextResponse.next();
  } catch (error) {
    console.error(`[Edge] Error in middleware:`, error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

// より具体的なmatcherの設定
export const config = {
  matcher: [
    // 認証が必要なパス
    "/dashboard/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/units/:path*",
    "/users/:path*",

    // 以下を除外
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
