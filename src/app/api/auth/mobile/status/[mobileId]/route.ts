import { mobileAuthSessions } from "../../../signin/route";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ mobileId: string }> }
) {
  try {
    const { mobileId } = await params;

    if (!mobileId) {
      return new Response(JSON.stringify({ error: "Missing mobile_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = mobileAuthSessions.get(mobileId);

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // セッションタイムアウトチェック（10分）
    const now = Date.now();
    const sessionAge = now - session.timestamp;
    if (sessionAge > 10 * 60 * 1000) {
      mobileAuthSessions.delete(mobileId);
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 408,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (session.completed && session.token && session.user) {
      // 認証完了後はセッションを削除
      mobileAuthSessions.delete(mobileId);

      return new Response(
        JSON.stringify({
          status: "completed",
          token: session.token,
          user: session.user,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "pending",
        message: "Authentication in progress",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Mobile auth status error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
