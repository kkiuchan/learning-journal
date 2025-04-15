import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { ApiResponse, FrontendUser, SearchResult } from "@/types";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: Learning Journal API
 *   version: 1.0.0
 *   description: 学習ジャーナルアプリケーションのAPI仕様
 * servers:
 *   - url: http://localhost:3000
 *     description: 開発環境
 *   - url: https://api.example.com
 *     description: 本番環境
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           nullable: true
 *         image:
 *           type: string
 *           nullable: true
 *         topImage:
 *           type: string
 *           nullable: true
 *         selfIntroduction:
 *           type: string
 *           nullable: true
 *         skills:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *           description: スキル（タグ名）
 *         interests:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *           description: 興味のある分野（タグ名）
 *         _count:
 *           type: object
 *           properties:
 *             units:
 *               type: integer
 *               description: ユニット数
 *             logs:
 *               type: integer
 *               description: ログ数（総学習時間として使用）
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: 現在のページ番号
 *         limit:
 *           type: integer
 *           description: 1ページあたりの表示件数
 *         totalPages:
 *           type: integer
 *           description: 総ページ数
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         status:
 *           type: integer
 * paths:
 *   /api/users/search:
 *     get:
 *       summary: ユーザーを検索
 *       description: |
 *         ユーザーを検索します。以下の情報から検索キーワードに一致するユーザーを返します：
 *         - ユーザー名
 *         - 自己紹介文
 *         - スキル（タグ名）
 *         - 興味のある分野（タグ名）
 *
 *         検索クエリが空の場合、または"*"の場合は全ユーザーを返します。
 *       tags: [ユーザー]
 *       parameters:
 *         - in: query
 *           name: query
 *           schema:
 *             type: string
 *           description: 検索キーワード（ユーザー名、自己紹介、スキル、興味のある分野で検索）。空または"*"の場合は全ユーザーを返します。
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *             minimum: 1
 *           description: ページ番号（デフォルト: 1）
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             minimum: 1
 *             maximum: 50
 *           description: 1ページあたりの件数（デフォルト: 20）
 *       responses:
 *         '200':
 *           description: 検索結果の取得に成功
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       users:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/User'
 *                       total:
 *                         type: integer
 *                         description: 検索結果の総件数
 *                       pagination:
 *                         $ref: '#/components/schemas/Pagination'
 *         '500':
 *           description: サーバーエラー
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: ユーザー検索中にエラーが発生しました
 *                 status: 500
 */

// クエリパラメータのバリデーションスキーマ
const searchQuerySchema = z.object({
  query: z.string().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(50))
    .optional(),
});

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<SearchResult>>> {
  await ensurePrismaConnected();
  try {
    const { searchParams } = new URL(request.url);
    const rawData = {
      query: searchParams.get("query"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    };

    const { query, page = 1, limit = 20 } = searchQuerySchema.parse(rawData);

    // 検索クエリが"*"の場合は全ユーザーを返す
    if (!query || query === "*") {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: {
                units: true,
              },
            },
            userSkills: {
              take: 5, // 最初の5つのスキルのみを取得
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
              take: 5, // 最初の5つの興味のみを取得
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
        }),
        prisma.user.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      const formattedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        image: user.image,
        skills: user.userSkills.map((skill) => ({
          id: String(skill.tag.id),
          name: skill.tag.name,
        })),
        interests: user.userInterests.map((interest) => ({
          id: String(interest.tag.id),
          name: interest.tag.name,
        })),
        _count: user._count,
      })) as FrontendUser[];

      return createApiResponse({
        users: formattedUsers,
        total,
        pagination: {
          page,
          limit,
          totalPages,
        },
      });
    }

    // 検索クエリがある場合は検索を実行
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { selfIntroduction: { contains: query, mode: "insensitive" } },
          {
            userSkills: {
              some: {
                tag: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
          {
            userInterests: {
              some: {
                tag: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
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
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { selfIntroduction: { contains: query, mode: "insensitive" } },
          {
            userSkills: {
              some: {
                tag: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
          {
            userInterests: {
              some: {
                tag: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
    });

    const totalPages = Math.ceil(total / limit);

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
      _count: user._count,
    })) as FrontendUser[];

    return createApiResponse({
      users: formattedUsers,
      total,
      pagination: {
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("ユーザー検索エラー:", error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0].message);
    }
    return createErrorResponse("ユーザー検索中にエラーが発生しました", 500);
  }
}
