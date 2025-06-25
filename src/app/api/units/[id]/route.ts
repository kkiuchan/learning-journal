import { createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidateUnitData } from "@/utils/server-cache";
// import { revalidateTag } from "next/cache";
import { unitUpdateSchema } from "@/types/unit";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * @swagger
 * /api/units/{id}:
 *   put:
 *     summary: ユニットを更新
 *     description: 指定されたIDのユニットを更新します。認証が必要です。
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: ユニットのタイトル
 *               learningGoal:
 *                 type: string
 *                 description: 学習目標
 *               preLearningState:
 *                 type: string
 *                 description: 事前学習状態
 *               reflection:
 *                 type: string
 *                 description: 振り返り
 *               nextAction:
 *                 type: string
 *                 description: 次のアクション
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: 開始日時
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: 終了日時
 *               status:
 *                 type: string
 *                 enum: [計画中, 進行中, 完了]
 *                 description: ステータス
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: タグ名の配列
 *     responses:
 *       200:
 *         description: ユニットの更新に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         description: ユニットが見つからない
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { id } = await params;
    // 現在のユーザーを取得
    const user = await getCurrentUserUnified();
    if (!user?.id) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    // ユニットの存在確認と権限チェック
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (unit.userId !== user.id) {
      return NextResponse.json(
        { error: "このユニットを更新する権限がありません", status: 403 },
        { status: 403 }
      );
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json();
    const validatedData = unitUpdateSchema.parse(body);

    // ユニットの更新
    const updatedUnit = await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.learningGoal !== undefined && {
          learningGoal: validatedData.learningGoal,
        }),
        ...(validatedData.preLearningState !== undefined && {
          preLearningState: validatedData.preLearningState,
        }),
        ...(validatedData.reflection !== undefined && {
          reflection: validatedData.reflection,
        }),
        ...(validatedData.nextAction !== undefined && {
          nextAction: validatedData.nextAction,
        }),
        ...(validatedData.achievementLevel !== undefined && {
          achievementLevel: validatedData.achievementLevel,
        }),
        ...(validatedData.startDate && {
          startDate: new Date(validatedData.startDate),
        }),
        ...(validatedData.endDate && {
          endDate: new Date(validatedData.endDate),
        }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.displayFlag !== undefined && {
          displayFlag: validatedData.displayFlag,
        }),
        ...(validatedData.tags && {
          unitTags: {
            deleteMany: {}, // 既存のタグをすべて削除
            create: validatedData.tags.map((tag: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tag },
                  create: { name: tag },
                },
              },
            })),
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        unitTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // キャッシュの再検証
    // revalidateTag(CACHE_TAGS.UNIT);
    // revalidateTag(CACHE_TAGS.UNIT_LIST);
    // revalidateTag(`${CACHE_TAGS.UNIT}-${id}`);
    revalidateUnitData(id);

    return NextResponse.json({ data: updatedUnit });
  } catch (error) {
    console.error("ユニットの更新中にエラーが発生しました:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "入力データが無効です",
          details: error.errors,
          status: 400,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "ユニットの更新中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     summary: ユニットを削除
 *     description: 指定されたIDのユニットを削除します。認証が必要です。
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
 *       204:
 *         description: ユニットの削除に成功
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
 *         description: ユニットが見つからない
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
  // await ensurePrismaConnected();
  try {
    const { id } = await params;
    const user = await getCurrentUserUnified();

    if (!user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません" },
        { status: 404 }
      );
    }

    if (unit.userId !== user.id) {
      return NextResponse.json(
        { error: "このユニットを削除する権限がありません" },
        { status: 403 }
      );
    }

    // トランザクションを使用して関連データも削除
    await prisma.$transaction(async (tx) => {
      // 1. ユニットに紐づく全ログIDを取得
      const logs = await tx.log.findMany({
        where: { unitId: parseInt(id) },
        select: { id: true },
      });
      const logIds = logs.map((log) => log.id);

      // 2. まずリソースを削除
      if (logIds.length > 0) {
        await tx.resource.deleteMany({
          where: { logId: { in: logIds } },
        });

        // 3. ログタグを削除
        await tx.logTag.deleteMany({
          where: { logId: { in: logIds } },
        });

        // 4. ログを削除
        await tx.log.deleteMany({
          where: { id: { in: logIds } },
        });
      }

      // 5. コメントを削除
      await tx.comment.deleteMany({
        where: { unitId: parseInt(id) },
      });

      // 6. いいねを削除
      await tx.unitLike.deleteMany({
        where: { unitId: parseInt(id) },
      });

      // 7. ユニットタグを削除
      await tx.unitTag.deleteMany({
        where: { unitId: parseInt(id) },
      });

      // 8. ユニット本体を削除
      await tx.unit.delete({
        where: { id: parseInt(id) },
      });
    });

    // キャッシュの再検証
    await revalidateUnitData(id);

    return NextResponse.json(
      { message: "ユニットを削除しました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("ユニットの削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニットの削除中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     summary: ユニットの詳細情報を取得
 *     description: 指定されたIDのユニットの詳細情報を取得します。
 *     tags: [ユニット]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ユニットID
 *     responses:
 *       200:
 *         description: ユニットの取得に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
 *       404:
 *         description: ユニットが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: レート制限エラー
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const numericId = parseInt(id);
    // await ensurePrismaConnected();

    if (isNaN(numericId)) {
      return createErrorResponse("無効なユニットIDです", 400);
    }

    const user = await getCurrentUserUnified();

    const unit = await prisma.unit.findUnique({
      where: { id: numericId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        unitTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            unitLikes: true,
            comments: true,
          },
        },
      },
    });

    if (!unit) {
      return createErrorResponse("ユニットが見つかりません", 404);
    }

    // いいね状態の確認
    let isLiked = false;
    if (user?.id) {
      const like = await prisma.unitLike.findFirst({
        where: {
          AND: [{ unitId: numericId }, { userId: user.id }],
        },
      });
      isLiked = !!like;
    }

    const response = NextResponse.json(
      {
        data: {
          ...unit,
          tags: unit.unitTags.map((ut) => ut.tag),
          isLiked,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("ユニット取得エラー:", error);
    return createErrorResponse(
      error instanceof Error
        ? error.message
        : "ユニットの取得中にエラーが発生しました",
      500
    );
  }
}

// キャッシュの有効期限を30分に設定（メタデータ生成と合わせる）
export const revalidate = 1800;
