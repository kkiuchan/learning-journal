import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { UnlinkAccountRequest } from "@/types/api";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

/**
 * @swagger
 * /api/auth/unlink-account:
 *   post:
 *     summary: 外部認証アカウントの連携解除
 *     tags: [認証]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 description: 連携解除する認証プロバイダー（google, github, discord）
 *     responses:
 *       200:
 *         description: アカウントの連携が解除されました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: アカウントの連携を解除しました
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: エラーメッセージ
 *                   examples:
 *                     - value: プロバイダーを指定してください
 *                     - value: 最後の認証方法は削除できません
 *       401:
 *         description: 認証エラー
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 認証が必要です
 *       404:
 *         description: ユーザーが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ユーザーが見つかりません
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: アカウントの連携解除中にエラーが発生しました
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    const formData = await request.formData();
    const requestData: UnlinkAccountRequest = {
      provider: formData.get("provider") as string,
    };

    // バリデーション
    if (!requestData.provider) {
      return createErrorResponse("プロバイダーを指定してください");
    }

    // ユーザーの取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // 認証方法の数を確認
    const authMethods = [
      user.hashedPassword,
      ...user.accounts.map((account) => account.provider),
    ].filter(Boolean);

    if (authMethods.length <= 1) {
      return createErrorResponse("最後の認証方法は削除できません");
    }

    // アカウントの削除
    await prisma.account.deleteMany({
      where: {
        userId: user.id,
        provider: requestData.provider,
      },
    });

    // 残りの認証方法に基づいてprimaryAuthMethodを更新
    const remainingMethods = authMethods.filter(
      (method) => method !== requestData.provider
    );
    const newPrimaryMethod = remainingMethods[0] || "email";

    await prisma.user.update({
      where: { id: user.id },
      data: { primaryAuthMethod: newPrimaryMethod },
    });

    return createSuccessResponse("アカウントの連携を解除しました");
  } catch (error) {
    console.error("アカウント連携解除エラー:", error);
    return createErrorResponse(
      "アカウントの連携解除中にエラーが発生しました",
      500
    );
  }
}
