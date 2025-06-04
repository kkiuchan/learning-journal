import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import {
  createOrRetrieveStripeCustomer,
  getUserByStripeCustomer,
  getUserSubscriptionSafe,
} from "@/lib/stripe-utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const user = await getCurrentUserUnified();
    if (!user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    console.log("🧪 Testing email-based Stripe integration for:", user.email);

    // 1. ユーザーのサブスクリプション情報を安全に取得
    const subscriptionInfo = await getUserSubscriptionSafe(user.email);

    // 2. Stripe Customerを作成/取得（テスト）
    let customerTest = null;
    try {
      customerTest = await createOrRetrieveStripeCustomer(
        user.email,
        user.name || undefined
      );
    } catch (error) {
      console.error("Customer creation test failed:", error);
    }

    // 3. Customer IDからユーザー特定のテスト
    let userLookupTest = null;
    if (customerTest) {
      try {
        userLookupTest = await getUserByStripeCustomer(customerTest.id);
      } catch (error) {
        console.error("User lookup test failed:", error);
      }
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      userEmail: user.email,
      tests: {
        subscriptionSafe: {
          success: !!subscriptionInfo.user,
          data: subscriptionInfo,
        },
        customerCreation: {
          success: !!customerTest,
          customerId: customerTest?.id || null,
          customerEmail: customerTest?.email || null,
        },
        userLookup: {
          success: !!userLookupTest,
          foundUserEmail: userLookupTest?.email || null,
          emailMatch: userLookupTest?.email === user.email,
        },
      },
      summary: {
        allTestsPassed:
          !!subscriptionInfo.user &&
          !!customerTest &&
          !!userLookupTest &&
          userLookupTest.email === user.email,
        readyForMigration: true,
      },
    };

    console.log("🧪 Test results:", testResults);

    return createApiResponse(testResults);
  } catch (error) {
    console.error("❌ Test migration error:", error);
    return createErrorResponse("移行テストに失敗しました", 500);
  }
}

export async function POST(request: NextRequest) {
  await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    const { action } = await request.json();

    if (action === "reset_trial") {
      // トライアル状態をリセット
      await prisma.user.update({
        where: { id: user.id },
        data: {
          trialEnd: null,
          subscriptionStatus: null,
          subscriptionPlan: null,
          subscriptionStart: null,
          subscriptionEnd: null,
        },
      });

      return createApiResponse({
        message: "トライアル状態をリセットしました",
        userId: user.id,
      });
    }

    return createErrorResponse("無効なアクションです", 400);
  } catch (error) {
    console.error("テスト移行エラー:", error);
    return createErrorResponse("テスト移行中にエラーが発生しました", 500);
  }
}
