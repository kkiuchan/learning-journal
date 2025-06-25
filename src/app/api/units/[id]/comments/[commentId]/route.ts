import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { commentUpdateSchema } from "@/types/comment";
import {
  revalidateCommentData,
  revalidateUnitData,
} from "@/utils/server-cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @swagger
 * /api/units/{id}/comments/{commentId}:
 *   put:
 *     summary: コメントを更新
 *     description: 指定されたIDのコメントを更新します。認証が必要です。
 *     tags: [ユニット]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ユニットID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: コメントID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: コメントの内容
 *     responses:
 *       200:
 *         description: コメントの更新に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         image:
 *                           type: string
 *       401:
 *         description: 認証エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 権限エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: コメントが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { id, commentId } = await params;
    const user = await getCurrentUserUnified();

    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // コメントの存在確認と権限チェック
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: { userId: true, unitId: true },
    });

    if (!comment) {
      return createErrorResponse("コメントが見つかりません", 404);
    }

    if (comment.userId !== user.id) {
      return createErrorResponse("このコメントを更新する権限がありません", 403);
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json();
    const validatedData = commentUpdateSchema.parse(body);

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: { comment: validatedData.content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // キャッシュの再検証
    revalidateCommentData(parseInt(commentId));
    revalidateUnitData(id);

    return createApiResponse(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "入力データが無効です",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return createErrorResponse("コメントの更新中にエラーが発生しました", 500);
  }
}

/**
 * @swagger
 * /api/units/{id}/comments/{commentId}:
 *   delete:
 *     summary: コメントを削除
 *     description: 指定されたIDのコメントを削除します。認証が必要です。
 *     tags: [ユニット]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ユニットID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: コメントID
 *     responses:
 *       204:
 *         description: コメントの削除に成功
 *       401:
 *         description: 認証エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 権限エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: コメントが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { id, commentId } = await params;
    const user = await getCurrentUserUnified();

    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // コメントの存在確認と権限チェック
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: { userId: true, unitId: true },
    });

    if (!comment) {
      return createErrorResponse("コメントが見つかりません", 404);
    }

    if (comment.userId !== user.id) {
      return createErrorResponse("このコメントを削除する権限がありません", 403);
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    // キャッシュの再検証
    revalidateCommentData(parseInt(commentId));
    revalidateUnitData(id);

    return createApiResponse({ id: commentId });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return createErrorResponse("コメントの削除中にエラーが発生しました", 500);
  }
}
