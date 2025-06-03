import { withApiSecurity } from "@/lib/api-security";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

async function handleMobileStatus(req: NextRequest) {
  try {
    // URLからsessionIdを取得
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const sessionId = pathSegments[pathSegments.length - 1];

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "セッションIDが必要です" },
        { status: 400 }
      );
    }

    // セッションファイルのパス
    const tempDir = path.join("/tmp", "oauth-sessions");
    const sessionFile = path.join(tempDir, `${sessionId}.json`);

    // セッションファイルの存在確認
    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json(
        {
          success: false,
          pending: true,
          message: "認証待機中...",
        },
        { status: 200 }
      );
    }

    // セッションデータを読み込み
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf8"));

    // 期限切れチェック
    if (Date.now() > sessionData.expires) {
      // 期限切れファイルを削除
      try {
        fs.unlinkSync(sessionFile);
      } catch (unlinkError) {
        console.error("期限切れファイル削除エラー:", unlinkError);
      }

      return NextResponse.json(
        {
          success: false,
          error: "認証セッションが期限切れです。再度お試しください。",
        },
        { status: 410 }
      );
    }

    // 認証完了データを返却
    console.log(`📤 セッション取得成功: ${sessionId}`);

    // セッションファイルを削除（一度だけ取得可能）
    try {
      fs.unlinkSync(sessionFile);
      console.log(`🗑️ セッションファイル削除: ${sessionId}`);
    } catch (unlinkError) {
      console.error("セッションファイル削除エラー:", unlinkError);
    }

    return NextResponse.json({
      success: true,
      data: {
        user: sessionData.user,
        token: sessionData.token,
        message: sessionData.message,
      },
    });
  } catch (error) {
    console.error("Mobile status API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "認証ステータス取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

// GET: Mobile Authentication Status Check
export const GET = withApiSecurity(handleMobileStatus, {
  rateLimit: {
    limit: 30, // 1分間に30回まで（2秒ごとのポーリング対応）
    windowMs: 60000,
  },
});
