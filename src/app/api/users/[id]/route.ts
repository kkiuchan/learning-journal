import { authConfig } from "@/auth.config";
import { createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { PublicUserResponse } from "@/types/api";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 特定のユーザーの公開情報を取得
 *     tags: [ユーザー]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ユーザーID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: ページ番号
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 1ページあたりの表示件数
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *         description: ソート順（newest: 新しい順, oldest: 古い順）
 *     responses:
 *       200:
 *         description: ユーザー情報の取得に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                           nullable: true
 *                         image:
 *                           type: string
 *                           nullable: true
 *                         topImage:
 *                           type: string
 *                           nullable: true
 *                         age:
 *                           type: integer
 *                           nullable: true
 *                         ageVisible:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         skills:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                         interests:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                         _count:
 *                           type: object
 *                           properties:
 *                             units:
 *                               type: integer
 *                     units:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               title:
 *                                 type: string
 *                               learningGoal:
 *                                 type: string
 *                                 nullable: true
 *                               preLearningState:
 *                                 type: string
 *                                 nullable: true
 *                               reflection:
 *                                 type: string
 *                                 nullable: true
 *                               nextAction:
 *                                 type: string
 *                                 nullable: true
 *                               status:
 *                                 type: string
 *                               startDate:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                               endDate:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                               displayFlag:
 *                                 type: boolean
 *                               likesCount:
 *                                 type: integer
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               totalLearningTime:
 *                                 type: integer
 *                               isLiked:
 *                                 type: boolean
 *                               tags:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     tag:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                         name:
 *                                           type: string
 *                               _count:
 *                                 type: object
 *                                 properties:
 *                                   logs:
 *                                     type: integer
 *                                   comments:
 *                                     type: integer
 *                               logs:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                     title:
 *                                       type: string
 *                                     learningTime:
 *                                       type: integer
 *                                       nullable: true
 *                                     note:
 *                                       type: string
 *                                       nullable: true
 *                                     logDate:
 *                                       type: string
 *                                       format: date-time
 *                                     tags:
 *                                       type: array
 *                                       items:
 *                                         type: object
 *                                         properties:
 *                                           tag:
 *                                             type: object
 *                                             properties:
 *                                               id:
 *                                                 type: integer
 *                                               name:
 *                                                 type: string
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             page:
 *                               type: integer
 *                             perPage:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *       404:
 *         description: ユーザーが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ユーザーが見つかりません
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ユーザー情報の取得中にエラーが発生しました
 */
export async function GET(
  request: Request,
  context: { params: { id: string } }
): Promise<NextResponse<{ data: PublicUserResponse } | { error: string }>> {
  try {
    const params = await context.params;
    const userId = params.id;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("perPage") || "10"))
    );
    const sort = searchParams.get("sort") || "newest";

    // セッション情報を取得（いいね状態の確認用）
    const session = await getServerSession(authConfig);
    const currentUserId = session?.user?.id;

    // ユーザー基本情報の取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        topImage: true,
        age: true,
        ageVisible: true,
        createdAt: true,
        userSkills: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        userInterests: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            units: true,
          },
        },
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // ユニット一覧の取得（ページネーション付き）
    const skip = (page - 1) * perPage;
    const where = {
      userId: userId,
      displayFlag: true,
    };

    const [units, totalUnits] = await Promise.all([
      prisma.unit.findMany({
        where,
        orderBy: {
          createdAt: sort === "newest" ? "desc" : "asc",
        },
        skip,
        take: perPage,
        select: {
          id: true,
          title: true,
          learningGoal: true,
          preLearningState: true,
          reflection: true,
          nextAction: true,
          status: true,
          startDate: true,
          endDate: true,
          displayFlag: true,
          likesCount: true,
          createdAt: true,
          unitTags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              logs: true,
              comments: true,
            },
          },
          logs: {
            orderBy: {
              logDate: "desc",
            },
            select: {
              id: true,
              title: true,
              learningTime: true,
              note: true,
              logDate: true,
              logTags: {
                select: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          unitLikes: currentUserId
            ? {
                where: {
                  userId: currentUserId,
                },
                take: 1,
              }
            : undefined,
        },
      }),
      prisma.unit.count({ where }),
    ]);

    // 総学習時間を計算する関数
    const calculateTotalLearningTime = async (
      unitId: number
    ): Promise<number> => {
      const result = await prisma.log.aggregate({
        where: {
          unitId,
          learningTime: {
            not: null,
          },
        },
        _sum: {
          learningTime: true,
        },
      });
      return result._sum.learningTime || 0;
    };

    // 各Unitの総学習時間を取得
    const unitsWithTotalTime = await Promise.all(
      units.map(async (unit) => {
        const totalLearningTime = await calculateTotalLearningTime(unit.id);
        return {
          ...unit,
          totalLearningTime,
          isLiked: unit.unitLikes && unit.unitLikes.length > 0,
          tags: unit.unitTags,
          logs: unit.logs.map((log) => ({
            id: log.id,
            title: log.title,
            learningTime: log.learningTime,
            note: log.note,
            logDate: log.logDate,
            tags: log.logTags,
          })),
        };
      })
    );

    // レスポンスの形式を整える
    const response: PublicUserResponse = {
      user: {
        ...user,
        skills: user.userSkills.map((skill) => skill.tag),
        interests: user.userInterests.map((interest) => interest.tag),
        _count: {
          units: user._count.units,
        },
      },
      units: {
        data: unitsWithTotalTime,
        pagination: {
          total: totalUnits,
          page,
          perPage,
          totalPages: Math.ceil(totalUnits / perPage),
        },
      },
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("ユーザー情報の取得中にエラーが発生しました:", error);
    return createErrorResponse(
      "ユーザー情報の取得中にエラーが発生しました",
      500
    );
  }
}
