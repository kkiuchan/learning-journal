import jwt from "jsonwebtoken";
import { mobileAuthSessions } from "../../signin/route";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mobileId = url.searchParams.get("mobile_id");
    const user = url.searchParams.get("user");
    const provider = url.searchParams.get("provider");

    if (!mobileId || !user || !provider) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const session = mobileAuthSessions.get(mobileId);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ユーザー情報をパース
    const userData = JSON.parse(decodeURIComponent(user));

    // JWTトークンを生成
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        sub: userData.id,
        email: userData.email,
        name: userData.name,
        provider: provider,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7日間有効
      },
      secret,
      { algorithm: "HS256" }
    );

    // セッション情報を更新
    session.completed = true;
    session.user = userData;
    session.token = token;

    return new Response(
      JSON.stringify({
        message: "Authentication completed successfully",
        token,
        user: userData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mobile auth callback error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
