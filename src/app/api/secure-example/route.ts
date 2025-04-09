import { validateRequestBody, withApiSecurity } from "@/lib/api-security";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { z } from "zod";

// リクエストボディのスキーマを定義
const exampleSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  message: z.string().min(5, "メッセージは5文字以上で入力してください"),
});

// スキーマの型を取得
type ExampleRequest = z.infer<typeof exampleSchema>;

/**
 * @swagger
 * /api/secure-example:
 *   post:
 *     summary: セキュアなAPI例
 *     tags: [例]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: ユーザー名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: メールアドレス
 *               message:
 *                 type: string
 *                 description: メッセージ内容
 *     responses:
 *       200:
 *         description: 成功レスポンス
 *       400:
 *         description: 入力エラー
 *       401:
 *         description: 認証エラー
 *       429:
 *         description: レート制限エラー
 */
export const POST = withApiSecurity(
  async (req: NextRequest) => {
    // リクエストボディの検証
    const validation = await validateRequestBody<ExampleRequest>(
      req,
      exampleSchema
    );

    // バリデーションエラーがある場合はエラーレスポンスを返す
    if ("error" in validation) {
      return validation.error;
    }

    // バリデーション済みのデータを取得
    const { data } = validation;

    try {
      // ここで実際の処理を行う（例: データベースへの保存など）
      console.log("処理されたデータ:", data);

      // 成功レスポンスを返す
      return createApiResponse({
        success: true,
        message: "データが正常に処理されました",
        data: {
          id: "example-id-123",
          processedAt: new Date().toISOString(),
          ...data,
        },
      });
    } catch (error) {
      // エラーレスポンスを返す
      console.error("APIエラー:", error);
      return createErrorResponse("データの処理中にエラーが発生しました", 500);
    }
  },
  {
    // 認証を必須にする
    requireAuth: true,
    // レート制限を設定する（例: 1分間に5リクエストまで）
    rateLimit: {
      limit: 5,
      windowMs: 60000, // 1分
    },
  }
);

/**
 * @swagger
 * /api/secure-example:
 *   get:
 *     summary: セキュアなAPI例 (GET)
 *     tags: [例]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功レスポンス
 *       401:
 *         description: 認証エラー
 *       429:
 *         description: レート制限エラー
 */
export const GET = withApiSecurity(
  async () => {
    return createApiResponse({
      message: "GET リクエストが正常に処理されました",
      timestamp: new Date().toISOString(),
    });
  },
  {
    // 認証を必須にする
    requireAuth: true,
    // レート制限を設定する（例: 1分間に10リクエストまで）
    rateLimit: {
      limit: 10,
      windowMs: 60000, // 1分
    },
  }
);
