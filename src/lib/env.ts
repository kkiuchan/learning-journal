import { z } from "zod";

/**
 * 必須環境変数のスキーマを定義
 */
const envSchema = z.object({
  // データベース
  DATABASE_URL: z.string().min(1),

  // 認証
  NEXTAUTH_SECRET: z.string().min(1),

  // アプリURL
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Supabase（ファイルアップロード用）
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // ログレベル（オプション）
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .optional()
    .default("error"),
});

/**
 * オプションの環境変数のスキーマを定義
 */
const optionalEnvSchema = z.object({
  // OAuth Providers（OAuth認証が必要な場合に設定）
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),

  // メール設定（メール送信機能が必要な場合に設定）
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // その他の環境変数
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * 環境変数を検証して型付きで返す
 */
export function validateEnv() {
  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.error(
      "❌ 必要な環境変数が不足しています:",
      parsedEnv.error.format()
    );
    throw new Error("必要な環境変数が不足しています");
  }

  const parsedOptionalEnv = optionalEnvSchema.safeParse(process.env);

  if (!parsedOptionalEnv.success) {
    console.warn(
      "⚠️ オプションの環境変数が正しく設定されていません:",
      parsedOptionalEnv.error.format()
    );
  }

  return {
    ...parsedEnv.data,
    ...(parsedOptionalEnv.success ? parsedOptionalEnv.data : {}),
  };
}

/**
 * 検証済みの環境変数
 */
export const env = validateEnv();
