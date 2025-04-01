import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: ユニット一覧を取得
 *     description: ユニットの一覧を取得します。検索、フィルタリング、ソート、ページネーションに対応しています。
 *     tags: [ユニット]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 検索キーワード（タイトル、学習目標、事前学習状態、振り返り、次のアクション、タグで検索）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [計画中, 進行中, 完了]
 *         description: ステータスでフィルタリング
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 作成者IDでフィルタリング
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: タグでフィルタリング（カンマ区切り）
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, likesCount, logs]
 *         description: ソート項目
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: ソート順序
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ページ番号（デフォルト: 1）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: 1ページあたりの件数（デフォルト: 20）
 *     responses:
 *       200:
 *         description: ユニット一覧の取得に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     units:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Unit'
 *                     total:
 *                       type: integer
 *                       description: 検索結果の総件数
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") as
      | "計画中"
      | "進行中"
      | "完了"
      | null;
    const userId = searchParams.get("userId");
    const tags = searchParams.get("tags")?.split(",") || [];
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // 検索条件の構築
    const where: Prisma.UnitWhereInput = {
      AND: [
        // 検索キーワード
        query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { learningGoal: { contains: query, mode: "insensitive" } },
                { preLearningState: { contains: query, mode: "insensitive" } },
                { reflection: { contains: query, mode: "insensitive" } },
                { nextAction: { contains: query, mode: "insensitive" } },
                {
                  unitTags: {
                    some: {
                      tag: {
                        name: { contains: query, mode: "insensitive" },
                      },
                    },
                  },
                },
              ],
            }
          : {},
        // ステータス
        status ? { status } : {},
        // 作成者
        userId ? { userId } : {},
        // タグ
        tags.length > 0
          ? {
              unitTags: {
                some: {
                  tag: {
                    name: { in: tags },
                  },
                },
              },
            }
          : {},
      ],
    };

    // ソート条件の構築
    const orderBy: Prisma.UnitOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // ユニットの取得
    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.unit.count({ where }),
    ]);

    // レスポンスの構築
    const response = {
      data: {
        units: units.map((unit) => ({
          ...unit,
          tags: unit.unitTags.map((ut) => ut.tag),
          _count: {
            ...unit._count,
            totalLearningTime: unit._count.logs, // ログ数を総学習時間として使用
          },
        })),
        total,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("ユニット一覧の取得中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニット一覧の取得中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: ユニットを新規作成
 *     description: 新しいユニットを作成します。認証が必要です。
 *     tags: [ユニット]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
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
 *                 description: ステータス（デフォルト: 計画中）
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: タグ名の配列
 *     responses:
 *       201:
 *         description: ユニットの作成に成功
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
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
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

    // Unitの作成
    const unit = await prisma.unit.create({
      data: {
        userId: session.user.id,
        title,
        learningGoal,
        preLearningState,
        reflection,
        nextAction,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || "計画中",
        // タグの関連付け（存在する場合）
        unitTags: tags
          ? {
              create: tags.map((tagName: string) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            }
          : undefined,
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

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("ユニットの作成中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニットの作成中にエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
