import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createOrRetrieveStripeCustomer } from "@/lib/stripe-utils";
import { getServerSupabaseUser } from "@/lib/supabase-auth";
import { NextRequest, NextResponse } from "next/server";

// 移行対象ユーザーの確認
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        primaryAuthMethod: true,
        stripeCustomerId: true,
        _count: {
          select: {
            units: true,
            logs: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.length,
        users: users,
      },
    });
  } catch (error) {
    console.error("User list error:", error);
    return NextResponse.json(
      { success: false, error: "ユーザー一覧取得に失敗しました" },
      { status: 500 }
    );
  }
}

// メールからStripe Customerを検索する関数
async function findStripeCustomerByEmail(email: string) {
  if (!stripe) return null;

  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    return customers.data.length > 0 ? customers.data[0] : null;
  } catch (error) {
    console.error("Stripe customer search error:", error);
    return null;
  }
}

// 新規Supabaseユーザーの作成
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    console.log("認証トークン確認:", {
      hasToken: !!token,
      tokenLength: token?.length,
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "認証トークンが必要です" },
        { status: 401 }
      );
    }

    // Supabase Authユーザーを取得
    const authUser = await getServerSupabaseUser(token);

    if (!authUser || !authUser.email) {
      console.log("Supabase認証失敗:", { authUser: !!authUser });
      return NextResponse.json(
        { success: false, error: "Supabase認証に失敗しました" },
        { status: 401 }
      );
    }

    console.log("認証成功:", {
      email: authUser.email,
      id: authUser.id,
      provider: authUser.app_metadata?.provider,
    });

    // 既存ユーザーをチェック（同じSupabase UUIDまたはメール）
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: authUser.id }, { email: authUser.email }],
      },
    });

    if (existingUser) {
      console.log("既存ユーザーが見つかりました:", {
        id: existingUser.id,
        email: existingUser.email,
        method: existingUser.primaryAuthMethod,
      });

      return NextResponse.json({
        success: true,
        data: {
          user: existingUser,
          migrated: false,
          message: "既存ユーザーです",
        },
      });
    }

    // Stripe Customerを確認
    const existingCustomer = await findStripeCustomerByEmail(authUser.email);

    // 新しいSupabaseユーザーを作成
    const newUser = await prisma.user.create({
      data: {
        id: authUser.id, // Supabase UUID
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split("@")[0],
        image: authUser.user_metadata?.avatar_url || null,
        primaryAuthMethod: "supabase",
        emailVerified: new Date(), // Supabase認証済み
        // Stripe情報を引き継ぎ
        stripeCustomerId: existingCustomer?.id || null,
      },
    });

    console.log("新規ユーザー作成完了:", {
      id: newUser.id,
      email: newUser.email,
      hasStripeCustomer: !!existingCustomer,
    });

    // 新規の場合はStripe Customer作成
    if (!existingCustomer) {
      await createOrRetrieveStripeCustomer(
        newUser.email,
        newUser.name || undefined
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: newUser,
        migrated: false,
        stripeCustomerExists: !!existingCustomer,
        message: "新規ユーザーを作成しました",
      },
    });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { success: false, error: "ユーザー作成に失敗しました" },
      { status: 500 }
    );
  }
}

// データベースリセット（開発環境のみ）
export async function DELETE() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "本番環境では実行できません" },
      { status: 403 }
    );
  }

  try {
    console.log("データベースリセットが推奨されます");
    console.log("実行してください: npx prisma migrate reset");

    return NextResponse.json({
      success: true,
      data: {
        message: "npx prisma migrate reset を実行してください",
        command: "npx prisma migrate reset",
      },
    });
  } catch (error) {
    console.error("Reset guidance error:", error);
    return NextResponse.json(
      { success: false, error: "リセット案内に失敗しました" },
      { status: 500 }
    );
  }
}
