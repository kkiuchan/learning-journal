import { env } from "@/lib/env";

interface ErrorLogData {
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  timestamp: string;
  userAgent?: string;
}

export async function logError(error: Error & { digest?: string }) {
  const errorData: ErrorLogData = {
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : undefined,
  };

  // ログレベルに応じて出力
  // 開発環境または本番環境でもerrorレベルの場合は常にコンソールに出力
  if (
    process.env.NODE_ENV === "development" ||
    env.LOG_LEVEL === "debug" ||
    env.LOG_LEVEL === "info" ||
    env.LOG_LEVEL === "warn" ||
    env.LOG_LEVEL === "error"
  ) {
    console.error("エラーログ:", errorData);
  }

  // デバッグモードではサーバーに送信しない
  if (process.env.NODE_ENV === "development" && env.LOG_LEVEL !== "debug") {
    return;
  }

  try {
    // ログをサーバーに送信
    await fetch("/api/logs/error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
    });
  } catch (e) {
    // エラーログの送信に失敗した場合はコンソールに出力
    console.error("エラーログの送信に失敗:", e);
    console.error("元のエラー:", errorData);
  }
}
