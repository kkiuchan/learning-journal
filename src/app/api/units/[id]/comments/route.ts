import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { revalidateCommentData, revalidateUnitData } from "@/utils/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/units/{id}/comments:
 *   get:
 *     summary: ユニットのコメント一覧を取得
 *     description: 指定されたIDのユニットのコメント一覧を取得します。
 *     tags: [ユニット]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ユニットID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: ページ番号
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 1ページあたりのコメント数
 *     responses:
 *       200:
 *         description: コメント一覧の取得に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
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
    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // ユニットの存在確認
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { id: true },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // コメントの取得
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { unitId: parseInt(id) },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: { unitId: parseInt(id) },
      }),
    ]);

    // レスポンスの構築
    const response = {
      data: comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // キャッシュヘッダーの設定
    const responseObj = NextResponse.json(response);
    responseObj.headers.set(
      "Cache-Control",
      "public, s-maxage=10, stale-while-revalidate=59"
    );

    return responseObj;
  } catch (error) {
    console.error("コメント一覧の取得中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "コメント一覧の取得中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/units/{id}/comments:
 *   post:
 *     summary: ユニットにコメントを追加
 *     description: 指定されたIDのユニットにコメントを追加します。認証が必要です。
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
 *               content:
 *                 type: string
 *                 description: コメントの内容
 *     responses:
 *       201:
 *         description: コメントの追加に成功
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
export async function POST(
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

    // ユニットの存在確認
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { id: true },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // リクエストボディの取得
    const body = await request.json();
    const { comment: content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "コメントの内容は必須です", status: 400 },
        { status: 400 }
      );
    }

    // コメントの作成
    const comment = await prisma.comment.create({
      data: {
        comment: content,
        unitId: parseInt(id),
        userId: session.user.id,
      },
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

    // ユニットのコメント数を更新
    await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });
    // キャッシュの再検証
    revalidateUnitData(id);
    revalidateCommentData(comment.id);

    return NextResponse.json({ data: comment });
  } catch (error) {
    console.error("コメントの作成中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "コメントの作成中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
