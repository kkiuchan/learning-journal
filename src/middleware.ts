// import { withAuth } from "next-auth/middleware";
// import { NextResponse } from "next/server";

// export default withAuth(
//   // 認証後に実行されるミドルウェア関数
//   function middleware(req) {
//     const { pathname } = req.nextUrl;
//     console.log("middleware==>", pathname);
//     const { token } = req.nextauth;
//     console.log("token==>", token);

//     // 認証が必要ないパスをチェック
//     const publicPaths = [
//       "/auth/login",
//       "/auth/signin",
//       "/auth/register",
//       "/auth/forgot-password",
//       "/api/docs", // API ドキュメント
//       "/_next", // Next.js の静的アセット
//       "/favicon.ico",
//       "/sw.js", // サービスワーカー
//       "/sw-register.js", // サービスワーカー登録スクリプト
//       "/manifest.json", // マニフェストファイル
//       "/offline.html", // オフラインページ
//     ];
//     const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
//     console.log("isPublicPath==>", isPublicPath);

//     // 認証が必要ないパスの場合はアクセスを許可
//     if (isPublicPath) {
//       return NextResponse.next();
//     }

//     // 未認証ユーザーはログインページにリダイレクト
//     if (!token) {
//       const url = new URL("/auth/login", req.url);
//       url.searchParams.set("callbackUrl", pathname);
//       return NextResponse.redirect(url);
//     }

//     // 管理者専用ルートのチェック
//     const adminPaths = ["/admin"];
//     const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

//     if (isAdminPath) {
//       // tokenからユーザーロールを取得
//       const userRole = token.role as string;

//       // 管理者ではない場合、ダッシュボードにリダイレクト
//       if (userRole !== "admin") {
//         return NextResponse.redirect(new URL("/dashboard", req.url));
//       }
//     }

//     // 認証済みユーザーはアクセス可能
//     return NextResponse.next();
//   },
//   {
//     pages: {
//       signIn: "/auth/login",
//     },
//     callbacks: {
//       authorized: ({ token }) => !!token,
//     },
//   }
// );

// export const config = {
//   // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
//   matcher: [
//     // 静的リソースとPWA関連ファイルを除外
//     "/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico|sw.js|sw-register.js|manifest.json|offline.html).*)",
//     // 管理者のパスは保護
//     "/admin/:path*",
//     // ダッシュボードは保護
//     "/dashboard/:path*",
//     // アカウント管理は保護
//     "/account/:path*",
//     // ユニット管理は保護
//     "/units/:path*",
//   ],
// };
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    console.error("===== 🔒 middleware triggered =====");
    console.error("📍 Pathname:", pathname);
    console.error("🔐 Token:", token);

    // 認証が不要なパス
    const publicPaths = [
      "/auth/login",
      "/auth/signin",
      "/auth/register",
      "/auth/forgot-password",
      "/api/docs",
      "/_next", // Next.js assets
      "/favicon.ico",
      "/sw.js",
      "/sw-register.js",
      "/manifest.json",
      "/offline.html",
    ];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    console.log("🌐 Public path?", isPublicPath);

    if (isPublicPath) {
      console.log("✅ Allowed (public path)");
      return NextResponse.next();
    }

    if (!token) {
      console.log("⛔️ Not authenticated, redirecting to login");
      const url = new URL("/auth/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // 管理者チェック
    const adminPaths = ["/admin"];
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

    if (isAdminPath) {
      const userRole = token.role as string;
      console.log("🛡 Admin path detected - role:", userRole);

      if (userRole !== "admin") {
        console.log("🚫 Access denied (not admin), redirecting to /dashboard");
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    console.log("✅ Authenticated access allowed");
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/login",
    },
    callbacks: {
      authorized: ({ token }) => {
        console.log("🧪 authorized() called - token:", token);
        // トークンの有効性をより詳細に確認
        if (!token) {
          console.log("❌ No token found");
          return false;
        }

        // トークンの有効期限をチェック（もし設定されている場合）
        if (token.exp && Date.now() >= (token.exp as number) * 1000) {
          console.log("❌ Token expired");
          return false;
        }

        console.log("✅ Token valid");
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico|sw.js|sw-register.js|manifest.json|offline.html).*)",
    "/admin/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/units/:path*",
  ],
};
