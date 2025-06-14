import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// 管理者メールアドレス
const adminEmails = [
  "bandman.gh.bs.dk.lav@gmail.com",
  // 他の管理者メールアドレスを追加
];

// 公開パス（認証不要）
const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/supabase-login",
  "/auth/supabase-register",
  "/auth/verify-notice",
  "/auth/callback",
  "/auth/error",
  "/api/auth/migrate-to-supabase",
  "/api/debug/supabase-session",
  "/api/auth/check-email",
  "/pricing",
  "/contact",
  "/terms",
  "/privacy",
  "/legal",
  "/guide",
  "/features",
  "/sitemap",
  // 公開ページを追加
  "/demo",
  "/demo/",
  "/features/",
  "/advertisement",
  "/advertisement/",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`[Supabase] Checking path: ${pathname}`);

  if (isPublicPath(pathname)) {
    console.log(`[Supabase] Access granted to public path: ${pathname}`);
    return NextResponse.next();
  }

  try {
    // Supabase Server Clientを作成
    const response = NextResponse.next();

    console.log(`[Supabase] Creating server client for path: ${pathname}`);

    // まず、現在のCookieを確認
    const allCookies = req.cookies.getAll();
    console.log(
      `[Supabase] All cookies found:`,
      allCookies.map((c) => c.name)
    );

    const supabaseCookies = allCookies.filter(
      (cookie) =>
        cookie.name.includes("supabase") ||
        cookie.name.startsWith("sb-") ||
        cookie.name.includes("supabase-auth")
    );
    console.log(
      `[Supabase] Supabase cookies:`,
      supabaseCookies.map(
        (c) =>
          `${c.name}=${c.value.length > 50 ? c.value.substring(0, 50) + "..." : c.value}`
      )
    );

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storageKey: "supabase-auth",
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        cookies: {
          get(name: string) {
            const value = req.cookies.get(name)?.value;
            if (
              name.includes("supabase") ||
              name.startsWith("sb-") ||
              name.includes("supabase-auth")
            ) {
              console.log(
                `[Supabase] Getting cookie ${name}:`,
                value ? `present (length: ${value.length})` : "missing"
              );
            }
            return value;
          },
          set(name: string, value: string, options: any) {
            if (
              name.includes("supabase") ||
              name.startsWith("sb-") ||
              name.includes("supabase-auth")
            ) {
              console.log(
                `[Supabase] Setting cookie ${name}:`,
                value ? `present (length: ${value.length})` : "empty"
              );
            }
            req.cookies.set(name, value);
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            if (
              name.includes("supabase") ||
              name.startsWith("sb-") ||
              name.includes("supabase-auth")
            ) {
              console.log(`[Supabase] Removing cookie ${name}`);
            }
            req.cookies.delete(name);
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    console.log(`[Supabase] Server client created, checking user...`);

    // ユーザー認証チェック
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log(`[Supabase] User check result:`, {
      hasUser: !!user,
      userId: user?.id || "none",
      userEmail: user?.email || "none",
      error: error?.message || "none",
    });

    if (error || !user) {
      console.log(`[Supabase] Authentication failed - redirecting to login`);
      const url = new URL("/auth/supabase-login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // 管理者パスチェック
    const adminPaths = ["/admin"];
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

    if (isAdminPath) {
      const isAdmin = user.email && adminEmails.includes(user.email);

      if (!isAdmin) {
        console.log(
          `[Supabase] Access denied to admin path for: ${user.email}`
        );
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      console.log(`[Supabase] Admin access granted for: ${user.email}`);
    }

    console.log(
      `[Supabase] Access granted for authenticated user: ${user.email}`
    );
    return response;
  } catch (error) {
    console.error("[Supabase] Middleware error:", error);
    const url = new URL("/auth/supabase-login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/account/:path*",
    "/admin/:path*",
    // 必要に応じて他の認証必須パスを追加
  ],
};
