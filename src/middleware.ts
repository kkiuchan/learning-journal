import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 認証が不要なパス
const publicPaths = [
  "/",
  "/demo",
  "/units", // ユニット一覧
  "/units/:path*", // ユニット詳細
  "/users", // ユーザー一覧
  "/users/:path*", // ユーザー詳細
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

  // APIルートの場合は処理をスキップ
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 詳細ページのパターンマッチング
  const isUnitDetail = /^\/units\/[0-9]+$/.test(pathname);
  const isUserDetail = /^\/users\/[^/]+$/.test(pathname);

  // パスチェックを最適化
  const isPublicPath =
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    ) ||
    isUnitDetail ||
    isUserDetail;

  // --- 追加: bot判定 ---
  const botUserAgents = [
    "Twitterbot",
    "facebookexternalhit",
    "Slackbot",
    "Discordbot",
    "LinkedInBot",
    "Googlebot",
    "Bingbot",
    "Applebot",
    "Yeti",
    "Yahoo! Slurp",
    "DuckDuckBot",
    "facebot",
    "ia_archiver",
  ];
  const userAgent = req.headers.get("user-agent") || "";
  const isBot = botUserAgents.some((bot) => userAgent.includes(bot));
  const isTopPage = pathname === "/";

  // botが対象ページにアクセスした場合は認証スキップ
  if (isBot && (isUnitDetail || isUserDetail || isTopPage)) {
    console.log(
      `[Edge] Bot detected (${userAgent}) - skipping auth for ${pathname}`
    );
    return NextResponse.next();
  }
  // --- ここまで追加 ---

  console.log(`[Edge] Checking path: ${pathname}`);
  console.log(`[Edge] Is public path: ${isPublicPath}`);
  console.log(`[Edge] NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`[Edge] Has NEXTAUTH_SECRET: ${!!process.env.NEXTAUTH_SECRET}`);

  if (isPublicPath) {
    console.log(`[Edge] Access granted to public path: ${pathname}`);
    return NextResponse.next();
  }

  try {
    // JWTトークンを手動で取得
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
    });

    console.log(`[Edge] Cookie header:`, req.headers.get("cookie"));
    console.log(`[Edge] Token:`, JSON.stringify(token, null, 2));

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

    console.log(`[Edge] Access granted for user: ${token.sub}`);
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
    "/admin/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    {
      source:
        "/((?!api/|_next/|.*\\.|favicon.ico|sw.js|sw-register.js|manifest.json|offline.html).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
