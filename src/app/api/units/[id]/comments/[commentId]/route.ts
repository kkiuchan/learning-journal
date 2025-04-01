import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  try {
    // 認証チェック
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    // コメントの存在確認と権限チェック
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "コメントが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "このコメントを更新する権限がありません", status: 403 },
        { status: 403 }
      );
    }

    // リクエストボディの取得
    const body = await request.json();
    const { comment: commentContent } = body;

    if (!commentContent) {
      return NextResponse.json(
        { error: "コメントの内容は必須です", status: 400 },
        { status: 400 }
      );
    }

    // コメントの更新
    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: { comment: commentContent },
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

    return NextResponse.json({ data: updatedComment });
  } catch (error) {
    console.error("コメントの更新中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "コメントの更新中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
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
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id, commentId } = await params;
  try {
    // 認証チェック
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    // コメントの存在確認と権限チェック
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "コメントが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "このコメントを削除する権限がありません", status: 403 },
        { status: 403 }
      );
    }

    // コメントの削除
    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    // ユニットのコメント数を更新
    await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        commentsCount: {
          decrement: 1,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("コメントの削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "コメントの削除中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
