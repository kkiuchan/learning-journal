import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: 現在のユーザー情報を取得
 *     description: ログインしているユーザーの情報を取得します
 *     tags: [ユーザー]
 *     security:
 *       - bearerAuth: []
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     image:
 *                       type: string
 *                       nullable: true
 *                     topImage:
 *                       type: string
 *                       nullable: true
 *                     selfIntroduction:
 *                       type: string
 *                       nullable: true
 *                     age:
 *                       type: integer
 *                       nullable: true
 *                     ageVisible:
 *                       type: boolean
 *                     email:
 *                       type: string
 *                     primaryAuthMethod:
 *                       type: string
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                     interests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *       401:
 *         description: 認証エラー
 *       500:
 *         description: サーバーエラー
 *   put:
 *     summary: ユーザー情報を更新
 *     description: ログインしているユーザーの情報を更新します
 *     tags: [ユーザー]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 nullable: true
 *               selfIntroduction:
 *                 type: string
 *                 nullable: true
 *               age:
 *                 type: integer
 *                 nullable: true
 *               ageVisible:
 *                 type: boolean
 *               topImage:
 *                 type: string
 *                 nullable: true
 *               image:
 *                 type: string
 *                 nullable: true
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: スキル名の配列
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 関心分野名の配列
 *     responses:
 *       200:
 *         description: ユーザー情報の更新に成功
 *       400:
 *         description: バリデーションエラー
 *       401:
 *         description: 認証エラー
 *       500:
 *         description: サーバーエラー
 */

// ユーザー情報更新のバリデーションスキーマ
const updateUserSchema = z.object({
  name: z.string().nullable().optional(),
  selfIntroduction: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  ageVisible: z.boolean().optional(),
  topImage: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  skills: z.array(z.string().min(1).max(50)).max(10).optional(),
  interests: z.array(z.string().min(1).max(50)).max(10).optional(),
});

// キャッシュの有効期限を60秒に設定
export const revalidate = 60;

export async function GET() {
  await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // ユーザー情報を取得
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        topImage: true,
        selfIntroduction: true,
        age: true,
        ageVisible: true,
        createdAt: true,
        updatedAt: true,
        userSkills: { select: { tag: { select: { id: true, name: true } } } },
        userInterests: {
          select: { tag: { select: { id: true, name: true } } },
        },
        _count: {
          select: {
            units: true,
            logs: true,
            comments: true,
            unitLikes: true,
          },
        },
      },
    });

    if (!userInfo) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // userSkills, userInterestsからtag配列に変換してskills, interestsとして返す
    return createApiResponse({
      ...userInfo,
      skills: (userInfo.userSkills ?? []).map((skill) => skill.tag),
      interests: (userInfo.userInterests ?? []).map((interest) => interest.tag),
      userSkills: undefined,
      userInterests: undefined,
    });
  } catch (error) {
    console.error("ユーザー情報取得エラー:", error);
    return createErrorResponse(
      "ユーザー情報の取得中にエラーが発生しました",
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    const body = await request.json();
    const { name, selfIntroduction, age, ageVisible, topImage, image } = body;

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(selfIntroduction !== undefined && { selfIntroduction }),
        ...(age !== undefined && { age }),
        ...(ageVisible !== undefined && { ageVisible }),
        ...(topImage !== undefined && { topImage }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        topImage: true,
        selfIntroduction: true,
        age: true,
        ageVisible: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createApiResponse(updatedUser);
  } catch (error) {
    console.error("ユーザー情報更新エラー:", error);
    return createErrorResponse(
      "ユーザー情報の更新中にエラーが発生しました",
      500
    );
  }
}
