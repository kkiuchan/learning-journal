import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          error: "Supabase環境変数が設定されていません",
          missing: {
            url: !supabaseUrl,
            serviceKey: !supabaseServiceKey,
          },
        },
        { status: 500 }
      );
    }

    // Service Role クライアントでAdmin APIにアクセス
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // テスト用の設定情報を取得
    const configInfo: {
      supabaseUrl: string;
      hasServiceKey: boolean;
      timestamp: string;
      adminApiAccess?: boolean;
      userCount?: number;
      adminApiError?: string;
    } = {
      supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      timestamp: new Date().toISOString(),
    };

    // 管理者権限でユーザー情報の取得をテスト
    try {
      const { data: users, error: usersError } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

      configInfo.adminApiAccess = !usersError;
      configInfo.userCount = users?.users?.length || 0;
    } catch (error) {
      configInfo.adminApiAccess = false;
      configInfo.adminApiError =
        error instanceof Error ? error.message : "Unknown error";
    }

    return NextResponse.json({
      message: "Supabase設定確認完了",
      config: configInfo,
      recommendations: [
        "✅ Supabase Dashboard で Email Templates を日本語に設定",
        "✅ Authentication → Settings で 'Confirm email' を有効化",
        "✅ Redirect URLs に '/auth/callback' を追加",
        "📧 メール送信テストの実行を推奨",
      ],
    });
  } catch (error) {
    console.error("Supabase設定確認エラー:", error);
    return NextResponse.json(
      {
        error: "設定確認中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
