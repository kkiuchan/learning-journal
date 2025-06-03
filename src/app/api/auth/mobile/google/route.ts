import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Missing access token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let googleUser;

    // 開発環境でのモック認証対応
    if (accessToken === "mock_google_access_token_for_development") {
      console.log("🔧 Mock Google認証を処理中...");

      // 実際のデータベースユーザーIDを使用
      googleUser = {
        id: "cmbbjq9700000le0f9a9i6gja", // 実際のデータベースユーザーID
        email: "test@example.com",
        name: "Test User",
        picture: "https://via.placeholder.com/150",
      };

      console.log(
        "✅ Mock user created（実際のDBユーザーID使用）:",
        googleUser.email
      );
    } else {
      // 本番環境: GoogleのユーザーAPI経由でユーザー情報を取得
      const userResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!userResponse.ok) {
        return new Response(JSON.stringify({ error: "Invalid access token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      googleUser = await userResponse.json();
    }

    // JWTトークンを生成
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is not configured");
    }

    const user = {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.picture,
      provider: "google",
    };

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        provider: "google",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7日間有効
      },
      secret,
      { algorithm: "HS256" }
    );

    console.log("✅ Mobile Google authentication successful:", user.email);

    return new Response(
      JSON.stringify({
        success: true,
        user,
        token,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mobile Google auth error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
