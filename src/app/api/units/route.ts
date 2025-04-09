import { authConfig } from "@/auth.config";
import { withApiSecurity } from "@/lib/api-security";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/utils/cache";
import { Prisma } from "@prisma/client";
import { getServerSession, Session } from "next-auth";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// キャッシュの有効期限を60秒に設定
export const revalidate = 60;

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
 *       429:
 *         description: レート制限エラー
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const GET = withApiSecurity(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
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

      // セッションの取得
      const session = await getServerSession(authConfig);
      const currentUserId = session?.user?.id;

      // 検索条件の構築
      const where: Prisma.UnitWhereInput = {
        AND: [
          // 検索キーワード
          query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { learningGoal: { contains: query, mode: "insensitive" } },
                  {
                    preLearningState: { contains: query, mode: "insensitive" },
                  },
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
            unitLikes: currentUserId
              ? {
                  where: {
                    userId: currentUserId,
                  },
                }
              : false,
          },
        }),
        prisma.unit.count({ where }),
      ]);

      // タグをフォーマット
      const formattedUnits = units.map((unit) => {
        const { unitTags, unitLikes, ...rest } = unit;
        return {
          ...rest,
          tags: unitTags.map((unitTag) => unitTag.tag),
          isLiked: Array.isArray(unitLikes) && unitLikes.length > 0,
        };
      });

      // ページネーション情報
      const totalPages = Math.ceil(total / limit);
      const pagination = {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return createApiResponse({
        units: formattedUnits,
        total,
        pagination,
      });
    } catch (error) {
      console.error("ユニット一覧取得エラー:", error);
      return createErrorResponse(
        "ユニット一覧の取得中にエラーが発生しました",
        500
      );
    }
  },
  {
    // 認証は不要（公開情報）
    requireAuth: false,
    // レート制限を設定（1分間に30リクエストまで）
    rateLimit: {
      limit: 30,
      windowMs: 60000,
    },
  }
);

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: 新規ユニットを作成
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
 *               - learningGoal
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
 *               status:
 *                 type: string
 *                 enum: [計画中, 進行中, 完了]
 *                 default: 計画中
 *                 description: ステータス
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: タグの配列
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
 *         description: リクエストが不正
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
 *       429:
 *         description: レート制限エラー
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const POST = withApiSecurity(
  async (req: NextRequest, sessionOrContext?: unknown) => {
    try {
      const session = sessionOrContext as Session;
      // セッションは認証済み（withApiSecurityで確認済み）
      const userId = session.user.id;
      const body = await req.json();

      // 必須フィールドのバリデーション
      const { title, learningGoal } = body;
      if (!title || !learningGoal) {
        return createErrorResponse("タイトル、学習目標は必須です", 400);
      }

      // オプションフィールドの取得
      const { preLearningState, status = "計画中", tags = [] } = body;

      // ユニットの作成
      const unit = await prisma.unit.create({
        data: {
          title,
          learningGoal,
          preLearningState: preLearningState || "",
          status,
          userId,
          unitTags: {
            create: tags.map((tag: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tag },
                  create: { name: tag },
                },
              },
            })),
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
        },
      });

      // フォーマットされたユニットを返す
      const { unitTags, ...restUnit } = unit;
      const formattedUnit = {
        ...restUnit,
        tags: unitTags.map((unitTag) => unitTag.tag),
        isLiked: false,
      };

      // キャッシュの無効化
      revalidateTag(CACHE_TAGS.UNIT);
      revalidateTag(CACHE_TAGS.UNIT_LIST);

      return NextResponse.json({ data: formattedUnit }, { status: 201 });
    } catch (error) {
      console.error("ユニット作成エラー:", error);
      return createErrorResponse("ユニットの作成中にエラーが発生しました", 500);
    }
  },
  {
    // 認証が必要
    requireAuth: true,
    // レート制限を設定（1分間に10リクエストまで）
    rateLimit: {
      limit: 10,
      windowMs: 60000,
    },
  }
);
