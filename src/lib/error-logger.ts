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

  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV === "development") {
    console.error("エラーログ:", errorData);
    return;
  }

  try {
    // 本番環境ではエラーログをサーバーに送信
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
