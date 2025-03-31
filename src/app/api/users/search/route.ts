import { createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: ユーザーを検索
 *     description: |
 *       ユーザーを検索します。以下の情報から検索キーワードに一致するユーザーを返します：
 *       - ユーザー名
 *       - 自己紹介文
 *       - スキル（タグ名）
 *       - 興味のある分野（タグ名）
 *     tags: [ユーザー]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 検索キーワード（ユーザー名、自己紹介、スキル、興味のある分野で検索）
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
 *         description: 検索結果の取得に成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                             nullable: true
 *                           image:
 *                             type: string
 *                             nullable: true
 *                           topImage:
 *                             type: string
 *                             nullable: true
 *                           selfIntroduction:
 *                             type: string
 *                             nullable: true
 *                           skills:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                             description: スキル（最大3件）
 *                           interests:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                             description: 興味のある分野（最大3件）
 *                           _count:
 *                             type: object
 *                             properties:
 *                               units:
 *                                 type: integer
 *                               totalLearningTime:
 *                                 type: integer
 *                     total:
 *                       type: integer
 *       400:
 *         description: バリデーションエラー
 *       500:
 *         description: サーバーエラー
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!query) {
      return createErrorResponse("検索キーワードを入力してください", 400);
    }

    const skip = (page - 1) * limit;

    const searchCondition: Prisma.UserWhereInput = {
      OR: [
        {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          selfIntroduction: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          userSkills: {
            some: {
              tag: {
                name: {
                  contains: query,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        },
        {
          userInterests: {
            some: {
              tag: {
                name: {
                  contains: query,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: searchCondition,
        select: {
          id: true,
          name: true,
          image: true,
          topImage: true,
          selfIntroduction: true,
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
              logs: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({
        where: searchCondition,
      }),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      image: user.image,
      topImage: user.topImage,
      selfIntroduction: user.selfIntroduction,
      skills: user.userSkills.map((skill) => ({
        id: String(skill.tag.id),
        name: skill.tag.name,
      })),
      interests: user.userInterests.map((interest) => ({
        id: String(interest.tag.id),
        name: interest.tag.name,
      })),
      _count: {
        units: user._count.units,
        totalLearningTime: user._count.logs,
      },
    }));

    const response = {
      users: formattedUsers,
      total,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("ユーザー検索中にエラーが発生しました:", error);
    return createErrorResponse("ユーザー検索中にエラーが発生しました", 500);
  }
}
