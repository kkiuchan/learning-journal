import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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
  try {
    const { id } = await params;
    // 認証チェック
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    // ユニットの存在確認と権限チェック
    const existingUnit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (existingUnit.userId !== session.user.id) {
      return NextResponse.json(
        { error: "このユニットを編集する権限がありません", status: 403 },
        { status: 403 }
      );
    }

    // リクエストボディの取得
    const body = await request.json();
    const {
      title,
      learningGoal,
      preLearningState,
      reflection,
      nextAction,
      startDate,
      endDate,
      status,
      tags,
    } = body;

    // バリデーション
    if (!title) {
      return NextResponse.json(
        { error: "タイトルは必須です", status: 400 },
        { status: 400 }
      );
    }

    // Unitの更新
    const unit = await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        title,
        learningGoal,
        preLearningState,
        reflection,
        nextAction,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        // タグの更新
        unitTags: {
          deleteMany: {}, // 既存のタグを削除
          create: tags
            ? tags.map((tagName: string) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              }))
            : [],
        },
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
        _count: {
          select: {
            logs: true,
            unitLikes: true,
            comments: true,
          },
        },
      },
    });

    // レスポンスの構築
    const response = {
      data: {
        ...unit,
        tags: unit.unitTags.map((ut) => ut.tag),
        _count: {
          ...unit._count,
          totalLearningTime: unit._count.logs, // ログ数を総学習時間として使用
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("ユニットの更新中にエラーが発生しました:", error);
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

    // ユニットの存在確認と権限チェック
    const existingUnit = await prisma.unit.findUnique({
      where: { id: parseInt(params.id) },
      select: { userId: true },
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (existingUnit.userId !== session.user.id) {
      return NextResponse.json(
        { error: "このユニットを削除する権限がありません", status: 403 },
        { status: 403 }
      );
    }

    // Unitの削除
    await prisma.unit.delete({
      where: { id: parseInt(params.id) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("ユニットの削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニットの削除中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     summary: ユニットの詳細を取得
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
 *         description: ユニットの詳細取得に成功
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
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // セッションの取得
    const session = await getServerSession(authConfig);
    const currentUserId = session?.user?.id;

    // ユニットの取得
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
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
        logs: {
          orderBy: {
            logDate: "desc",
          },
          take: 5, // 最新5件のログを取得
          include: {
            logTags: {
              include: {
                tag: true,
              },
            },
          },
        },
        comments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // 最新5件のコメントを取得
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            logs: true,
            unitLikes: true,
            comments: true,
          },
        },
        unitLikes: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
            }
          : false,
      },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // レスポンスの構築
    const response = {
      data: {
        ...unit,
        tags: unit.unitTags.map((ut) => ut.tag),
        isLiked: currentUserId
          ? unit.unitLikes && unit.unitLikes.length > 0
          : false,
        _count: {
          ...unit._count,
          totalLearningTime: unit._count.logs, // ログ数を総学習時間として使用
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("ユニットの取得中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニットの取得中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
