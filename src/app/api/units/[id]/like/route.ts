import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
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
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    const unitId = parseInt(params.id);
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: "無効なユニットIDです", status: 400 },
        { status: 400 }
      );
    }

    // ユニットの存在確認
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { id: true },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // いいねの重複チェック
    const existingLike = await prisma.unitLike.findUnique({
      where: {
        userId_unitId: {
          userId: session.user.id,
          unitId: unitId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "すでにいいね済みです", status: 409 },
        { status: 409 }
      );
    }

    // いいねの作成
    await prisma.unitLike.create({
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

    return NextResponse.json({ message: "いいねを追加しました" });
  } catch (error) {
    console.error("いいねの追加中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "いいねの追加中にエラーが発生しました", status: 500 },
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
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    const unitId = parseInt(params.id);
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: "無効なユニットIDです", status: 400 },
        { status: 400 }
      );
    }

    // いいねの存在確認
    const like = await prisma.unitLike.findUnique({
      where: {
        userId_unitId: {
          userId: session.user.id,
          unitId: unitId,
        },
      },
    });

    if (!like) {
      return NextResponse.json(
        { error: "いいねが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // いいねの削除
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

    return NextResponse.json({ message: "いいねを削除しました" });
  } catch (error) {
    console.error("いいねの削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "いいねの削除中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
