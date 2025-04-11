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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`[Edge] Request URL: ${req.url}`);
  console.log(`[Edge] Cookies:`, req.cookies.toString());

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
      req,
      secret: process.env.NEXTAUTH_SECRET,
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
      const url = new URL("/auth/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // 管理者チェック
    const adminPaths = ["/admin"];
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

    if (isAdminPath && token.role !== "admin") {
      console.log(`[Edge] Non-admin access attempt to admin path`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    console.log(`[Edge] Access granted to: ${pathname}`);
    return NextResponse.next();
  } catch (error) {
    console.error(`[Edge] Error in middleware:`, error);
    // エラーが発生した場合はログインページにリダイレクト
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico|sw.js|sw-register.js|manifest.json|offline.html).*)",
    "/admin/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/units/:path*",
  ],
};
