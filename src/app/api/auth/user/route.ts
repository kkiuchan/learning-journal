import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUserUnified();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        primaryAuthMethod: user.primaryAuthMethod,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStart: user.subscriptionStart,
        subscriptionEnd: user.subscriptionEnd,
        stripeCustomerId: user.stripeCustomerId,
      },
    });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { success: false, error: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
