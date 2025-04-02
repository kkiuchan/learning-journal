import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      // 認証が必要ないパスをチェック
      const publicPaths = ["/auth/login", "/auth/register"];
      const isPublicPath = publicPaths.some((path) =>
        req.nextUrl.pathname.startsWith(path)
      );

      // 認証が必要ないパスの場合はアクセスを許可
      if (isPublicPath) return true;

      // 認証済みユーザーはアクセス可能
      if (token) return true;

      // 未認証ユーザーはログインページにリダイレクト
      return false;
    },
  },
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    "/dashboard/:path*",
    "/manage/:path*",
    "/account/:path*",
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
  ],
};
