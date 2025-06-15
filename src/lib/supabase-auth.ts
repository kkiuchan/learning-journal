import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

// 環境変数の検証とデバッグ
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("✅ 環境変数の検証が完了しました");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase環境変数が設定されていません:", {
    url: !!supabaseUrl,
    key: !!supabaseKey,
  });
  throw new Error("Supabase configuration is missing");
}

console.log("Supabase initialization:", {
  supabaseUrl,
  hasKey: !!supabaseKey,
});

// Supabaseクライアントをシングルトンパターンで作成
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      auth: {
        storageKey: "supabase-auth",
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "learning-journal-app",
        },
      },
    });

    console.log("Supabaseクライアントが初期化されました");

    // 認証状態変更の監視を設定
    if (typeof window !== "undefined") {
      supabaseInstance.auth.onAuthStateChange((event: string, session: any) => {
        console.log(
          `[Supabase] Auth state changed: ${event}`,
          session ? "Session present" : "No session"
        );

        // セッション情報をローカルストレージにも保存
        if (session) {
          localStorage.setItem(
            "supabase-session",
            JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user: session.user,
              expires_at: session.expires_at,
            })
          );
        } else {
          localStorage.removeItem("supabase-session");
        }
      });
    }
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// エクスポート用のプロキシオブジェクト
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// 認証ヘルパー関数
export async function getSupabaseUser() {
  const client = getSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

export async function getServerSupabaseUser(token: string) {
  try {
    const client = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Failed to get Supabase user:", error);
    return null;
  }
}

// セッション管理
export async function getSupabaseSession() {
  const client = getSupabaseClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

// 認証状態の変更を監視 これは使わない 公式のsupabase.auth.onAuthStateChangeを使う
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const client = getSupabaseClient();
  return client.auth.onAuthStateChange(callback);
}

// OAuth認証
export async function signInWithOAuth(
  provider: "google" | "github" | "discord"
) {
  const client = getSupabaseClient();
  return await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// ログアウト
export async function signOut() {
  const client = getSupabaseClient();
  return await client.auth.signOut();
}

// メール/パスワード認証
export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  return await client.auth.signInWithPassword({
    email,
    password,
  });
}

// ユーザー登録
export async function signUpWithPassword(
  email: string,
  password: string,
  userData?: { name?: string }
) {
  const client = getSupabaseClient();
  return await client.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// パスワードリセット
export async function resetPassword(email: string) {
  const client = getSupabaseClient();
  return await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}

// 確認メール再送信（Supabase Auth統一）
export async function resendConfirmationEmail(email: string) {
  const client = getSupabaseClient();
  return await client.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// パスワード更新
export async function updatePassword(password: string) {
  const client = getSupabaseClient();
  return await client.auth.updateUser({ password });
}
