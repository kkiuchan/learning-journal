// メールアドレスの既存確認とプロバイダー情報取得
export async function checkEmailExists(email: string) {
  try {
    console.log("🔍 Checking email:", email);

    const response = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Response error:", errorText);
      throw new Error(
        `メールアドレス確認APIエラー: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("✅ Response data:", data);
    return data;
  } catch (error) {
    console.error("❌ Email check error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      email,
    });

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("ネットワークエラー: サーバーに接続できませんでした");
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "メールアドレス確認に失敗しました"
    );
  }
}

// プロバイダー名を日本語に変換
export function getProviderDisplayName(provider: string): string {
  const providerNames: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    discord: "Discord",
    email: "メール/パスワード",
  };

  return providerNames[provider] || provider;
}

// エラーメッセージを生成
export function generateAuthConflictMessage(
  action: "login" | "register",
  availableProviders: string[]
): string {
  const providerNames = availableProviders.map(getProviderDisplayName);

  if (action === "register") {
    return `このメールアドレスは既に${providerNames.join("・")}で登録されています。そちらでログインしてください。`;
  } else {
    return `このメールアドレスは${providerNames.join("・")}で登録されています。正しい認証方法でログインしてください。`;
  }
}
