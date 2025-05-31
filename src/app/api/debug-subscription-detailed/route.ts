import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getUserPlan } from "@/lib/plans";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return createApiResponse({
        hasSession: false,
        message: "セッションが存在しません",
      });
    }

    console.log("🔍 セッション情報:", {
      email: session.user.email,
      name: session.user.name,
    });

    // ユーザーのサブスクリプション情報を取得（生データ）
    const userRaw = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // 同じクエリで selectを使用
    const userSelected = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        trialEnd: true,
        cancelAtPeriodEnd: true,
        canceledAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!userRaw || !userSelected) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // subscriptionEndの詳細チェック
    const subscriptionEndAnalysis = {
      raw: {
        value: userRaw.subscriptionEnd,
        type: typeof userRaw.subscriptionEnd,
        isNull: userRaw.subscriptionEnd === null,
        isUndefined: userRaw.subscriptionEnd === undefined,
        toString: userRaw.subscriptionEnd?.toString(),
        toISOString: userRaw.subscriptionEnd?.toISOString(),
      },
      selected: {
        value: userSelected.subscriptionEnd,
        type: typeof userSelected.subscriptionEnd,
        isNull: userSelected.subscriptionEnd === null,
        isUndefined: userSelected.subscriptionEnd === undefined,
        toString: userSelected.subscriptionEnd?.toString(),
        toISOString: userSelected.subscriptionEnd?.toISOString(),
      },
    };

    // getUserPlan関数の動作をテスト
    const currentPlan = getUserPlan(
      userSelected.subscriptionStatus,
      userSelected.subscriptionPlan
    );

    // isActiveの計算ロジックをテスト（各段階）
    const now = new Date();
    const isLifetime = userSelected.subscriptionStatus === "lifetime";
    const isActiveStep1 = userSelected.subscriptionStatus === "active";
    const isActiveStep2 = userSelected.subscriptionEnd && true; // subscriptionEndの存在チェック
    const isActiveStep3 = userSelected.subscriptionEnd
      ? new Date(userSelected.subscriptionEnd) > now
      : false;
    const isActiveCondition1 = isActiveStep1 && isActiveStep2 && isActiveStep3;

    const isTrialing = userSelected.subscriptionStatus === "trialing";
    const trialCondition1 = userSelected.trialEnd
      ? new Date(userSelected.trialEnd) > now
      : false;
    const trialCondition2 = userSelected.subscriptionEnd
      ? new Date(userSelected.subscriptionEnd) > now
      : false;
    const isActiveCondition2 =
      isTrialing && (trialCondition1 || trialCondition2);

    const finalIsActive =
      isLifetime || isActiveCondition1 || isActiveCondition2;

    // API応答の構築テスト
    const apiResponseData = {
      currentPlan,
      isActive: finalIsActive,
      subscriptionStatus: userSelected.subscriptionStatus,
      subscriptionPlan: userSelected.subscriptionPlan,
      subscriptionStart: userSelected.subscriptionStart,
      subscriptionEnd: userSelected.subscriptionEnd,
      trialEnd: userSelected.trialEnd,
      isLifetime: userSelected.subscriptionStatus === "lifetime",
      hasStripeSubscription: !!userSelected.stripeSubscriptionId,
      cancelAtPeriodEnd: userSelected.cancelAtPeriodEnd,
      canceledAt: userSelected.canceledAt,
    };

    return createApiResponse({
      sessionInfo: {
        email: session.user.email,
        hasSession: true,
      },
      databaseComparison: {
        rawUser: {
          id: userRaw.id,
          email: userRaw.email,
          subscriptionStatus: userRaw.subscriptionStatus,
          subscriptionPlan: userRaw.subscriptionPlan,
          subscriptionEnd: userRaw.subscriptionEnd,
          trialEnd: userRaw.trialEnd,
        },
        selectedUser: userSelected,
      },
      subscriptionEndAnalysis,
      isActiveCalculation: {
        steps: {
          isLifetime,
          isActiveStep1,
          isActiveStep2,
          isActiveStep3,
          isActiveCondition1,
          isTrialing,
          trialCondition1,
          trialCondition2,
          isActiveCondition2,
          finalIsActive,
        },
        currentTime: now.toISOString(),
      },
      apiResponseData,
      potentialIssues: {
        subscriptionEndNull: userSelected.subscriptionEnd === null,
        subscriptionEndUndefined: userSelected.subscriptionEnd === undefined,
        subscriptionEndEmpty:
          userSelected.subscriptionEnd === null
            ? false
            : userSelected.subscriptionEnd.toString() === "",
        dateConversionIssue: userSelected.subscriptionEnd
          ? isNaN(new Date(userSelected.subscriptionEnd).getTime())
          : false,
      },
    });
  } catch (error) {
    console.error("詳細デバッグAPI エラー:", error);
    return createErrorResponse(
      "デバッグに失敗しました: " + (error as Error).message,
      500
    );
  }
}
