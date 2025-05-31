import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { createCustomerPortalSession } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("🏪 Customer Portal session creation started");

  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      console.log("❌ No session or email");
      return createErrorResponse("認証が必要です", 401);
    }

    console.log("👤 User email:", session.user.email);

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        stripeCustomerId: true,
      },
    });

    console.log("🔍 User lookup result:", {
      found: !!user,
      stripeCustomerId: user?.stripeCustomerId,
    });

    if (!user || !user.stripeCustomerId) {
      console.log("❌ No user or stripeCustomerId");
      return createErrorResponse("Stripeカスタマー情報が見つかりません", 404);
    }

    console.log("🎫 Creating portal session...");

    // カスタマーポータルセッションを作成
    const portalSession = await createCustomerPortalSession(
      user.stripeCustomerId,
      `${req.nextUrl.origin}/pricing` // リターンURL
    );

    console.log("✅ Portal session created:", portalSession.url);

    return createApiResponse({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("❌ カスタマーポータルセッション作成エラー:", error);
    return createErrorResponse(
      "カスタマーポータルセッションの作成に失敗しました",
      500
    );
  }
}
