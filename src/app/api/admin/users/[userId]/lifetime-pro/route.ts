import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// 管理者権限チェック（現在は特定のメールアドレスで判定）
function isAdmin(email: string): boolean {
  const adminEmails = [
    "bandman.gh.bs.dk.lav@gmail.com", // あなたのメールアドレス
    // "friend@example.com", // 知人のメールアドレス（例）
    // "admin@company.com", // 会社の管理者（例）
    // 他の管理者のメールアドレスをここに追加
  ];
  return adminEmails.includes(email);
}

// ライフタイムプロプラン付与
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // 管理者権限チェック
    if (!isAdmin(session.user.email)) {
      return createErrorResponse("管理者権限が必要です", 403);
    }

    const { userId } = params;
    const { reason } = await req.json();

    // 対象ユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
        stripeSubscriptionId: true,
      },
    });

    if (!targetUser) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // 既にライフタイムプロプランの場合
    if (targetUser.subscriptionStatus === "lifetime") {
      return createErrorResponse(
        "このユーザーは既にライフタイムプロプランです",
        400
      );
    }

    // 既にプロプラン（有料・トライアル）を使っている場合は付与を拒否
    const hasActiveProPlan =
      (targetUser.subscriptionStatus === "active" ||
        targetUser.subscriptionStatus === "trialing") &&
      targetUser.subscriptionPlan === "pro" &&
      targetUser.subscriptionEnd &&
      new Date(targetUser.subscriptionEnd) > new Date();

    if (hasActiveProPlan) {
      const statusText =
        targetUser.subscriptionStatus === "trialing"
          ? "トライアル中"
          : "有料プロプラン";
      return createErrorResponse(
        `このユーザーは既に${statusText}です。永年プロプランの付与は無料プランのユーザーのみ可能です。`,
        400
      );
    }

    // Stripeサブスクリプションが存在する場合も拒否
    if (targetUser.stripeSubscriptionId) {
      return createErrorResponse(
        "このユーザーはStripeサブスクリプションが存在します。先にサブスクリプションをキャンセルしてから永年プロプランを付与してください。",
        400
      );
    }

    // 遠い未来の日付（2099年12月31日）を設定
    const lifetimeEndDate = new Date("2099-12-31T23:59:59.999Z");

    // ライフタイムプロプランを付与（既存フィールドを活用）
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "lifetime",
        subscriptionPlan: "pro",
        subscriptionStart: new Date(),
        subscriptionEnd: lifetimeEndDate,
        // Stripe関連は無効化
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });

    // ログを記録（必要に応じて）
    console.log(
      `ライフタイムプロプラン付与: ${targetUser.email} by ${session.user.email}, reason: ${reason || "未指定"}`
    );

    return createApiResponse({
      message: "ライフタイムプロプランを付与しました",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
      grantedBy: session.user.email,
      grantedAt: new Date().toISOString(),
      reason: reason || null,
    });
  } catch (error) {
    console.error("ライフタイムプロプラン付与エラー:", error);
    return createErrorResponse(
      "ライフタイムプロプランの付与に失敗しました",
      500
    );
  }
}

// ライフタイムプロプラン取り消し
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // 管理者権限チェック
    if (!isAdmin(session.user.email)) {
      return createErrorResponse("管理者権限が必要です", 403);
    }

    const { userId } = params;
    const { reason } = await req.json();

    // 対象ユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
      },
    });

    if (!targetUser) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    if (targetUser.subscriptionStatus !== "lifetime") {
      return createErrorResponse(
        "このユーザーはライフタイムプロプランではありません",
        400
      );
    }

    // ライフタイムプロプランを取り消し（無料プランに戻す）
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: null,
        subscriptionPlan: null,
        subscriptionStart: null,
        subscriptionEnd: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });

    // ログを記録（必要に応じて）
    console.log(
      `ライフタイムプロプラン取り消し: ${targetUser.email} by ${session.user.email}, reason: ${reason || "未指定"}`
    );

    return createApiResponse({
      message: "ライフタイムプロプランを取り消しました",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
      revokedBy: session.user.email,
      revokedAt: new Date().toISOString(),
      reason: reason || null,
    });
  } catch (error) {
    console.error("ライフタイムプロプラン取り消しエラー:", error);
    return createErrorResponse(
      "ライフタイムプロプランの取り消しに失敗しました",
      500
    );
  }
}
