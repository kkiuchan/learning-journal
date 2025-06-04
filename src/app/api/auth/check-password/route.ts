import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getSupabaseServerUser } from "@/lib/auth-helpers";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { CheckPasswordResponse } from "@/types/api";

/**
 * @swagger
 * /api/auth/check-password:
 *   get:
 *     summary: パスワード認証の有無を確認
 *     tags: [認証]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: パスワード認証の有無
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasPassword:
 *                       type: boolean
 *                       description: パスワード認証が設定されているかどうか
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
 */
export async function GET() {
  await ensurePrismaConnected();
  try {
    const user = await getSupabaseServerUser();

    if (!user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { hashedPassword: true },
    });

    if (!dbUser) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    const response: CheckPasswordResponse = {
      hasPassword: !!dbUser.hashedPassword,
    };

    return createApiResponse(response);
  } catch (error) {
    console.error("パスワード確認エラー:", error);
    return createErrorResponse("パスワード確認中にエラーが発生しました", 500);
  }
}
