import bcryptjs from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { LinkAccountRequest, AuthResponse } from "@/types/api";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

/**
 * @swagger
 * /api/auth/link-account:
 *   post:
 *     summary: パスワード認証の追加・更新
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
 *               currentPassword:
 *                 type: string
 *                 description: 現在のパスワード（パスワード変更時のみ必須）
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: 新しいパスワード（8文字以上）
 *               confirmPassword:
 *                 type: string
 *                 description: 新しいパスワードの確認
 *     responses:
 *       200:
 *         description: パスワードが更新されました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: パスワードを更新しました
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
 *                     - value: すべての項目を入力してください
 *                     - value: パスワードを入力してください
 *                     - value: 新しいパスワードが一致しません
 *                     - value: パスワードは8文字以上で入力してください
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
 *                   example: パスワードの更新中にエラーが発生しました
 */

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    // セッション情報の検証
    if (!session?.user) {
      return createErrorResponse("認証が必要です", 401);
    }

    if (!session.user.email) {
      return createErrorResponse("メールアドレスが見つかりません", 400);
    }

    const formData = await request.formData();
    const requestData: LinkAccountRequest = {
      email: formData.get("email") as string,
      currentPassword: formData.get("currentPassword") as string,
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

    // ユーザーの取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { hashedPassword: true },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // パスワード変更の場合
    if (user.hashedPassword) {
      if (
        !requestData.currentPassword ||
        !requestData.newPassword ||
        !requestData.confirmPassword
      ) {
        return createErrorResponse("すべての項目を入力してください");
      }

      // 現在のパスワードの検証
      const isValid = await bcryptjs.compare(
        requestData.currentPassword,
        user.hashedPassword
      );
      if (!isValid) {
        return createErrorResponse("現在のパスワードが正しくありません");
      }
    } else {
      // 新規パスワード設定の場合
      if (!requestData.newPassword || !requestData.confirmPassword) {
        return createErrorResponse("パスワードを入力してください");
      }
    }

    // 新規パスワードの一致確認
    if (requestData.newPassword !== requestData.confirmPassword) {
      return createErrorResponse("新しいパスワードが一致しません");
    }

    // パスワードの長さチェック
    if (requestData.newPassword.length < 8) {
      return createErrorResponse("パスワードは8文字以上で入力してください");
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

    return createSuccessResponse("パスワードを更新しました");
  } catch (error) {
    console.error("パスワード更新エラー:", error);
    return createErrorResponse("パスワードの更新中にエラーが発生しました", 500);
  }
}
