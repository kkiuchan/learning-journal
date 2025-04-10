import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // 認証後に実行されるミドルウェア関数
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // 認証が必要ないパスをチェック
    const publicPaths = [
      "/auth/login",
      "/auth/signin",
      "/auth/register",
      "/auth/forgot-password",
      "/api/docs", // API ドキュメント
      "/_next", // Next.js の静的アセット
      "/favicon.ico",
      "/sw.js", // サービスワーカー
      "/sw-register.js", // サービスワーカー登録スクリプト
      "/manifest.json", // マニフェストファイル
      "/offline.html", // オフラインページ
    ];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    // 認証が必要ないパスの場合はアクセスを許可
    if (isPublicPath) {
      return NextResponse.next();
    }

    // 未認証ユーザーはログインページにリダイレクト
    if (!token) {
      const url = new URL("/auth/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // 管理者専用ルートのチェック
    const adminPaths = ["/admin"];
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

    if (isAdminPath) {
      // tokenからユーザーロールを取得
      const userRole = token.role as string;

      // 管理者ではない場合、ダッシュボードにリダイレクト
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // 認証済みユーザーはアクセス可能
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/login",
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    // 静的リソースとPWA関連ファイルを除外
    "/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico|sw.js|sw-register.js|manifest.json|offline.html).*)",
    // 管理者のパスは保護
    "/admin/:path*",
    // ダッシュボードは保護
    "/dashboard/:path*",
    // アカウント管理は保護
    "/account/:path*",
    // ユニット管理は保護
    "/units/:path*",
  ],
};
