import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";

// Supabaseサーバークライアント作成
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Auth] Missing Supabase environment variables");
    throw new Error("Supabase configuration is missing");
  }

  console.log("[Auth] Creating Supabase server client...");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: "supabase-auth",
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    cookies: {
      get(name: string) {
        const value = cookieStore.get(name)?.value;
        if (
          name.includes("supabase") ||
          name.startsWith("sb-") ||
          name.includes("supabase-auth")
        ) {
          console.log(
            `[Auth] Getting cookie ${name}:`,
            value ? `present (length: ${value.length})` : "missing"
          );
        }
        return value;
      },
      set(name: string, value: string, options: any) {
        try {
          if (
            name.includes("supabase") ||
            name.startsWith("sb-") ||
            name.includes("supabase-auth")
          ) {
            console.log(
              `[Auth] Setting cookie ${name}:`,
              value ? `present (length: ${value.length})` : "empty"
            );
          }
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          console.warn(`[Auth] Failed to set cookie ${name}:`, error);
          // set cookieは読み取り専用の場合があるのでエラーを無視
        }
      },
      remove(name: string, options: any) {
        try {
          if (
            name.includes("supabase") ||
            name.startsWith("sb-") ||
            name.includes("supabase-auth")
          ) {
            console.log(`[Auth] Removing cookie ${name}`);
          }
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          console.warn(`[Auth] Failed to remove cookie ${name}:`, error);
          // remove cookieは読み取り専用の場合があるのでエラーを無視
        }
      },
    },
  });
}

// サーバーサイドでのユーザー取得（エラーハンドリング強化版）
export async function getSupabaseServerUser(retryCount: number = 0) {
  try {
    console.log(
      `[Auth] Getting Supabase server user... (retry: ${retryCount})`
    );
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log("[Auth] User fetch result:", {
      hasUser: !!user,
      userId: user?.id || "none",
      userEmail: user?.email || "none",
      error: error?.message || "none",
      retryCount,
    });

    if (error) {
      console.error("[Auth] Failed to get Supabase server user:", error);

      // 特定のエラーの場合はリトライする
      if (
        retryCount < 2 &&
        (error.message.includes("Auth session missing") ||
          error.message.includes("Invalid Refresh Token") ||
          error.message.includes("token_refresh_failed"))
      ) {
        console.log(
          `[Auth] Retrying user fetch... (attempt ${retryCount + 1})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * (retryCount + 1))
        ); // 段階的遅延
        return getSupabaseServerUser(retryCount + 1);
      }

      return null;
    }

    return user;
  } catch (error) {
    console.error("[Auth] Exception in getSupabaseServerUser:", error);

    // 予期しないエラーでもリトライを試行
    if (retryCount < 1) {
      console.log(
        `[Auth] Retrying after exception... (attempt ${retryCount + 1})`
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      return getSupabaseServerUser(retryCount + 1);
    }

    return null;
  }
}

// サーバーサイドでのセッション取得
export async function getSupabaseServerSession() {
  try {
    console.log("[Auth] Getting Supabase server session...");
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    console.log("[Auth] Session fetch result:", {
      hasSession: !!session,
      userId: session?.user?.id || "none",
      userEmail: session?.user?.email || "none",
      hasAccessToken: !!session?.access_token,
      error: error?.message || "none",
    });

    if (error) {
      console.error("[Auth] Failed to get Supabase server session:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("[Auth] Exception in getSupabaseServerSession:", error);
    return null;
  }
}

// データベースからユーザー情報を取得（Supabase認証と連携）
export async function getCurrentUser() {
  const authUser = await getSupabaseServerUser();

  if (!authUser) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        primaryAuthMethod: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to get current user from database:", error);
    return null;
  }
}

// 管理者チェック
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return false;
  }

  const adminEmails = [
    "bandman.gh.bs.dk.lav@gmail.com",
    // 他の管理者メールアドレスを追加
  ];

  return adminEmails.includes(user.email);
}

// セッション型定義
export interface AuthSession {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    primaryAuthMethod: string;
    subscriptionStatus?: string | null;
    subscriptionPlan?: string | null;
  };
  expires: string;
}

// Authorizationヘッダーからトークンを使用してユーザーを取得
export async function getCurrentUserWithToken() {
  try {
    console.log("[Auth] getCurrentUserWithToken called");
    const headersList = await headers();
    const authorization = headersList.get("authorization");

    console.log(
      "[Auth] Authorization header:",
      authorization ? `Bearer ${authorization.substring(7, 27)}...` : "none"
    );

    if (authorization && authorization.startsWith("Bearer ")) {
      const token = authorization.substring(7);

      console.log("[Auth] Extracted token:", `${token.substring(0, 20)}...`);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log("[Auth] Environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlPrefix: supabaseUrl?.substring(0, 20) || "none",
        keyPrefix: supabaseAnonKey?.substring(0, 20) || "none",
      });

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[Auth] Missing Supabase environment variables");
        return null;
      }

      // トークンベースのSupabaseクライアントを作成
      console.log("[Auth] Creating token-based Supabase client");
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get() {
            return null;
          },
          set() {},
          remove() {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      console.log("[Auth] Calling supabase.auth.getUser()");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      console.log("[Auth] Token validation result:", {
        hasUser: !!user,
        userId: user?.id || "none",
        userEmail: user?.email || "none",
        error: error?.message || "none",
        errorCode: error?.code || "none",
      });

      if (error || !user) {
        console.error("[Auth] Failed to get user with token:", error);
        return null;
      }

      console.log("[Auth] Looking up user in database...");
      // データベースからユーザー情報を取得
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          primaryAuthMethod: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          subscriptionStart: true,
          subscriptionEnd: true,
          stripeCustomerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log("[Auth] Database user found:", {
        found: !!dbUser,
        userId: dbUser?.id || "none",
        userEmail: dbUser?.email || "none",
      });

      return dbUser;
    } else {
      console.log("[Auth] No valid Authorization header found");
    }
  } catch (error) {
    console.error("[Auth] Exception in getCurrentUserWithToken:", error);
  }

  // フォールバック: 通常のcookieベース認証
  console.log("[Auth] Falling back to cookie-based auth");
  return getCurrentUser();
}

// 統合されたユーザー取得関数
export async function getCurrentUserUnified() {
  // まずトークンベース認証を試行
  const tokenUser = await getCurrentUserWithToken();
  if (tokenUser) {
    return tokenUser;
  }

  // フォールバック: cookieベース認証
  return getCurrentUser();
}
