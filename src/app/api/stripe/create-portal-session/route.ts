import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
// import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: NextRequest) {
  // await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // ユーザーのStripe顧客IDを取得
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!userInfo?.stripeCustomerId) {
      return createErrorResponse("Stripe顧客IDが見つかりません", 404);
    }

    // ポータルセッションを作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userInfo.stripeCustomerId,
      return_url: `${req.nextUrl.origin}/dashboard`,
    });

    return createApiResponse({ url: portalSession.url });
  } catch (error) {
    console.error("ポータルセッション作成エラー:", error);
    return createErrorResponse("ポータルセッションの作成に失敗しました", 500);
  }
}
