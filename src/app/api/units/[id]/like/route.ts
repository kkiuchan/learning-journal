import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidateUnitData } from "@/utils/server-cache";
import { NextRequest } from "next/server";
// import { revalidateTag } from "next/cache";

/**
 * @swagger
 * /api/units/{id}/like:
 *   post:
 *     summary: ユニットにいいねを追加
 *     description: 指定されたIDのユニットにいいねを追加します。認証が必要です。
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
 *     responses:
 *       200:
 *         description: いいねの追加に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     likesCount:
 *                       type: integer
 *                       description: 更新後のいいね数
 *       401:
 *         description: 認証エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: ユニットが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: すでにいいね済み
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { id } = await params;
    const user = await getCurrentUserUnified();

    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // ユニットの存在確認
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, displayFlag: true },
    });

    if (!unit) {
      return createErrorResponse("ユニットが見つかりません", 404);
    }

    // 非公開ユニットはいいねできない
    if (!unit.displayFlag) {
      return createErrorResponse("非公開ユニットにはいいねできません", 403);
    }

    // 既にいいねしているかチェック
    const existingLike = await prisma.unitLike.findFirst({
      where: {
        AND: [{ unitId: parseInt(id) }, { userId: user.id }],
      },
    });

    if (existingLike) {
      return createErrorResponse("既にいいねしています", 400);
    }

    // いいねを作成
    const like = await prisma.unitLike.create({
      data: {
        unitId: parseInt(id),
        userId: user.id,
      },
    });

    // ユニットのいいね数を更新
    await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    });

    // キャッシュの再検証
    // revalidateTag(CACHE_TAGS.UNIT);
    // revalidateTag(CACHE_TAGS.UNIT_LIST);
    // revalidateTag(`${CACHE_TAGS.UNIT}-${id}`);
    revalidateUnitData(id);

    return createApiResponse(like);
  } catch (error) {
    console.error("Error creating like:", error);
    return createErrorResponse("いいねの追加中にエラーが発生しました", 500);
  }
}

/**
 * @swagger
 * /api/units/{id}/like:
 *   delete:
 *     summary: ユニットのいいねを削除
 *     description: 指定されたIDのユニットのいいねを削除します。認証が必要です。
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
 *     responses:
 *       200:
 *         description: いいねの削除に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     likesCount:
 *                       type: integer
 *                       description: 更新後のいいね数
 *       401:
 *         description: 認証エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: いいねが見つからない
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
  { params }: { params: Promise<{ id: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { id } = await params;
    const user = await getCurrentUserUnified();

    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // いいねの存在確認
    const like = await prisma.unitLike.findFirst({
      where: {
        AND: [{ unitId: parseInt(id) }, { userId: user.id }],
      },
    });

    if (!like) {
      return createErrorResponse("いいねが見つかりません", 404);
    }

    // いいねを削除
    await prisma.unitLike.delete({
      where: {
        userId_unitId: {
          userId: user.id,
          unitId: parseInt(id),
        },
      },
    });

    // ユニットのいいね数を更新
    await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    });

    // キャッシュの再検証
    // revalidateTag(CACHE_TAGS.UNIT);
    // revalidateTag(CACHE_TAGS.UNIT_LIST);
    // revalidateTag(`${CACHE_TAGS.UNIT}-${id}`);
    revalidateUnitData(id);

    return createApiResponse({ userId: user.id, unitId: parseInt(id) });
  } catch (error) {
    console.error("Error deleting like:", error);
    return createErrorResponse("いいねの削除中にエラーが発生しました", 500);
  }
}
