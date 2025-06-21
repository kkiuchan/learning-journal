import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// 管理者権限チェック
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  return adminEmails.includes(email);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // 管理者権限チェック
    if (!isAdmin(user.email)) {
      return createErrorResponse("管理者権限が必要です", 403);
    }

    const { userId } = await params;

    // ユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // ライフタイムプロプランに設定
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "active",
        subscriptionPlan: "lifetime_pro",
        subscriptionStart: new Date(),
        subscriptionEnd: null, // ライフタイムなので終了日なし
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    });

    return createApiResponse({
      message: "ライフタイムプロプランに設定しました",
      user: updatedUser,
    });
  } catch (error) {
    console.error("ライフタイムプロ設定エラー:", error);
    return createErrorResponse(
      "ライフタイムプロの設定中にエラーが発生しました",
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // 管理者権限チェック
    if (!isAdmin(user.email)) {
      return createErrorResponse("管理者権限が必要です", 403);
    }

    const { userId } = await params;

    // ユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // サブスクリプションを無効化
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: null,
        subscriptionPlan: null,
        subscriptionStart: null,
        subscriptionEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    });

    return createApiResponse({
      message: "ライフタイムプロプランを解除しました",
      user: updatedUser,
    });
  } catch (error) {
    console.error("ライフタイムプロ解除エラー:", error);
    return createErrorResponse(
      "ライフタイムプロの解除中にエラーが発生しました",
      500
    );
  }
}
