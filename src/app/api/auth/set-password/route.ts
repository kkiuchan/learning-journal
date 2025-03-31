import bcryptjs from "bcryptjs";
import { getServerSession } from "next-auth";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { SetPasswordRequest } from "@/types/api";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

/**
 * @swagger
 * /api/auth/set-password:
 *   post:
 *     summary: 新規パスワードの設定
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
 *               - email
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: ユーザーのメールアドレス
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: 新しいパスワード（8文字以上）
 *               confirmPassword:
 *                 type: string
 *                 description: 新しいパスワードの確認
 *     responses:
 *       200:
 *         description: パスワードが設定されました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: パスワードを設定しました
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
 *                     - value: メールアドレスを入力してください
 *                     - value: メールアドレスが一致しません
 *                     - value: パスワードを入力してください
 *                     - value: 新しいパスワードが一致しません
 *                     - value: パスワードは8文字以上で入力してください
 *                     - value: パスワードは既に設定されています
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
 *                   example: パスワードの設定中にエラーが発生しました
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    const formData = await request.formData();
    const requestData: SetPasswordRequest = {
      email: formData.get("email") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    // バリデーション
    if (!requestData.email) {
      return createErrorResponse("メールアドレスを入力してください");
    }

    // メールアドレスの一致を確認
    if (requestData.email !== session.user.email) {
      return createErrorResponse("メールアドレスが一致しません");
    }

    // パスワードの入力確認
    if (!requestData.newPassword || !requestData.confirmPassword) {
      return createErrorResponse("パスワードを入力してください");
    }

    // パスワードの一致確認
    if (requestData.newPassword !== requestData.confirmPassword) {
      return createErrorResponse("新しいパスワードが一致しません");
    }

    // パスワードの長さチェック
    if (requestData.newPassword.length < 8) {
      return createErrorResponse("パスワードは8文字以上で入力してください");
    }

    // ユーザーの取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { hashedPassword: true },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // パスワードが既に設定されている場合はエラー
    if (user.hashedPassword) {
      return createErrorResponse("パスワードは既に設定されています");
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcryptjs.hash(requestData.newPassword, 10);

    // ユーザーの更新
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        hashedPassword,
        primaryAuthMethod: "email",
      },
    });

    return createSuccessResponse("パスワードを設定しました");
  } catch (error) {
    console.error("パスワード設定エラー:", error);
    return createErrorResponse("パスワードの設定中にエラーが発生しました", 500);
  }
}
