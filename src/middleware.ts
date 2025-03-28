import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
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
