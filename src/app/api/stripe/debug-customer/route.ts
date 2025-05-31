import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("🔍 Debug customer info started");

  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // データベースからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    let stripeCustomer = null;
    let stripeError = null;

    // Stripe Customerが存在する場合、Stripeから情報を取得
    if (user.stripeCustomerId && stripe) {
      try {
        stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
      } catch (error) {
        stripeError = error instanceof Error ? error.message : String(error);
        console.error("❌ Stripe customer retrieval error:", error);
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      stripeEnvironment: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
        ? "live"
        : "test",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        stripeCustomerId: user.stripeCustomerId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
      },
      stripeCustomer: stripeCustomer
        ? {
            id: stripeCustomer.id,
            email: (stripeCustomer as any).email,
            created: new Date(
              (stripeCustomer as any).created * 1000
            ).toISOString(),
            deleted: (stripeCustomer as any).deleted || false,
          }
        : null,
      stripeError,
      hasStripeAccess: !!stripe,
    };

    console.log("🔍 Debug customer info:", debugInfo);

    return createApiResponse(debugInfo);
  } catch (error) {
    console.error("❌ Debug customer error:", error);
    return createErrorResponse("デバッグ情報の取得に失敗しました", 500);
  }
}
