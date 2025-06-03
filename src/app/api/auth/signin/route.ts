// モバイル認証用の一時ストレージ
const mobileAuthSessions = new Map<
  string,
  {
    provider: string;
    timestamp: number;
    user?: any;
    token?: string;
    completed?: boolean;
  }
>();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");
    const mobileId = url.searchParams.get("mobile_id");

    if (!provider || !mobileId) {
      return new Response(
        JSON.stringify({ error: "Missing provider or mobile_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 認証セッションを作成
    mobileAuthSessions.set(mobileId, {
      provider,
      timestamp: Date.now(),
      completed: false,
    });

    // 認証URLを生成（Next-AuthのGoogle認証エンドポイントを使用）
    const isDevelopment = process.env.NODE_ENV === "development";
    const baseUrl = isDevelopment
      ? "http://192.168.1.10:3000" // 開発環境：ネットワークIP
      : process.env.NEXTAUTH_URL || "http://localhost:3000"; // 本番環境

    // Next-AuthのGoogle認証エンドポイントにmobile_idをstateとして渡す
    const authUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(`${baseUrl}/api/auth/mobile/callback?mobile_id=${mobileId}`)}`;

    return new Response(
      JSON.stringify({
        authUrl,
        message: "Authentication session created",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mobile auth error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 一時ストレージをエクスポート（他のファイルから使用するため）
export { mobileAuthSessions };
