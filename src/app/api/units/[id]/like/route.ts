import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { revalidateUnitData } from "@/utils/cache";
import { getServerSession } from "next-auth";
// import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const unitId = parseInt(id);
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: "無効なユニットIDです" },
        { status: 400 }
      );
    }

    // いいねが既に存在するかチェック
    const existingLike = await prisma.unitLike.findFirst({
      where: {
        userId: session.user.id,
        unitId: unitId,
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "すでにいいねしています" },
        { status: 409 }
      );
    }

    // いいねを作成
    const like = await prisma.unitLike.create({
      data: {
        userId: session.user.id,
        unitId: unitId,
      },
    });

    // ユニットのいいね数を更新
    await prisma.unit.update({
      where: { id: unitId },
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

    return NextResponse.json({ data: like });
  } catch (error) {
    console.error("いいねの作成に失敗しました:", error);
    return NextResponse.json(
      { error: "いいねの作成に失敗しました" },
      { status: 500 }
    );
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const unitId = parseInt(id);
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: "無効なユニットIDです" },
        { status: 400 }
      );
    }

    // いいねが存在するかチェック
    const existingLike = await prisma.unitLike.findFirst({
      where: {
        userId: session.user.id,
        unitId: unitId,
      },
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: "いいねが存在しません" },
        { status: 404 }
      );
    }

    // いいねを削除
    await prisma.unitLike.delete({
      where: {
        userId_unitId: {
          userId: session.user.id,
          unitId: unitId,
        },
      },
    });

    // ユニットのいいね数を更新
    await prisma.unit.update({
      where: { id: unitId },
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
    return NextResponse.json({ message: "いいねを削除しました" });
  } catch (error) {
    console.error("いいねの削除に失敗しました:", error);
    return NextResponse.json(
      { error: "いいねの削除に失敗しました" },
      { status: 500 }
    );
  }
}
