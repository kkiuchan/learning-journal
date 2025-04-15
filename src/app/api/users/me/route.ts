import { mutateUserList } from "@/app/users/components/UserList";
import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { ApiResponse, ApiUser } from "@/types";
import { revalidateUserData } from "@/utils/cache";
import { getServerSession } from "next-auth";
// import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { mutate } from "swr";
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

export async function GET(): Promise<NextResponse<ApiResponse<ApiUser>>> {
  await ensurePrismaConnected();
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        image: true,
        topImage: true,
        selfIntroduction: true,
        age: true,
        ageVisible: true,
        email: true,
        primaryAuthMethod: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return createErrorResponse("ユーザーが見つかりません", 404);
    }

    // レスポンスの形式を整形
    const formattedUser: ApiUser = {
      id: user.id,
      name: user.name,
      image: user.image,
      topImage: user.topImage,
      selfIntroduction: user.selfIntroduction,
      age: user.age,
      ageVisible: user.ageVisible,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      skills: user.userSkills.map((skill) => ({
        id: String(skill.tag.id),
        name: skill.tag.name,
      })),
      interests: user.userInterests.map((interest) => ({
        id: String(interest.tag.id),
        name: interest.tag.name,
      })),
    };

    // キャッシュヘッダーの設定
    const responseObj = createApiResponse(formattedUser);
    responseObj.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return responseObj;
  } catch (error) {
    console.error("ユーザー情報の取得中にエラーが発生しました:", error);
    return createErrorResponse(
      "ユーザー情報の取得中にエラーが発生しました",
      500
    );
  }
}

export async function PUT(
  request: Request
): Promise<NextResponse<ApiResponse<ApiUser>>> {
  await ensurePrismaConnected();
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // スキルと関心分野の更新を処理
    const { skills, interests, ...userData } = validatedData;

    // トランザクションで一連の操作を実行
    const user = await prisma.$transaction(async (tx) => {
      // ユーザー基本情報の更新
      const updatedUser = await tx.user.update({
        where: { email: session.user.email },
        data: userData,
        select: {
          id: true,
          name: true,
          image: true,
          topImage: true,
          selfIntroduction: true,
          age: true,
          ageVisible: true,
          email: true,
          primaryAuthMethod: true,
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
          createdAt: true,
          updatedAt: true,
        },
      });

      // スキルの更新
      // if (skills) {
      //   // 既存のスキルを削除
      //   await tx.userSkill.deleteMany({
      //     where: { userId: updatedUser.id },
      //   });

      //   // 新しいスキルを追加（重複を防ぐため、小文字に変換）
      //   const uniqueSkills = [...new Set(skills.map((s) => s.toLowerCase()))];
      //   for (const skillName of uniqueSkills) {
      //     try {
      //       // タグが存在しない場合は作成
      //       const tag = await tx.tag.upsert({
      //         where: { name: skillName },
      //         create: { name: skillName },
      //         update: {},
      //       });

      //       // ユーザースキルを追加
      //       await tx.userSkill.create({
      //         data: {
      //           userId: updatedUser.id,
      //           tagId: tag.id,
      //         },
      //       });
      //     } catch (error) {
      //       console.error(
      //         `スキル "${skillName}" の追加中にエラーが発生しました:`,
      //         error
      //       );
      //       throw new Error(
      //         `スキルの更新中にエラーが発生しました: ${skillName}`
      //       );
      //     }
      //   }
      // }
      if (skills) {
        // 既存のスキルを一括削除
        await tx.userSkill.deleteMany({ where: { userId: updatedUser.id } });
        const uniqueSkills = [...new Set(skills.map((s) => s.toLowerCase()))];

        // 各スキルのタグアップサートとユーザースキル作成を並列実行
        await Promise.all(
          uniqueSkills.map(async (skillName) => {
            try {
              // タグのアップサート
              const tag = await tx.tag.upsert({
                where: { name: skillName },
                create: { name: skillName },
                update: {},
              });
              // ユーザースキルの作成
              await tx.userSkill.create({
                data: {
                  userId: updatedUser.id,
                  tagId: tag.id,
                },
              });
            } catch (error) {
              console.error(
                `スキル "${skillName}" の追加中にエラーが発生しました:`,
                error
              );
              throw new Error(
                `スキルの更新中にエラーが発生しました: ${skillName}`
              );
            }
          })
        );
      }

      if (interests) {
        //既存の関心分野を一括削除
        await tx.userInterest.deleteMany({ where: { userId: updatedUser.id } });
        const uniqueInterests = [
          ...new Set(interests.map((i) => i.toLowerCase())),
        ];

        //各関心分野のタグアップサートとユーザー関心分野作成を並列実行
        await Promise.all(
          uniqueInterests.map(async (interestName) => {
            try {
              //タグのアップサート
              const tag = await tx.tag.upsert({
                where: { name: interestName },
                create: { name: interestName },
                update: {},
              });

              //ユーザー関心分野の作成
              await tx.userInterest.create({
                data: {
                  userId: updatedUser.id,
                  tagId: tag.id,
                },
              });
            } catch (error) {
              console.error(
                `関心分野 "${interestName}" の追加中にエラーが発生しました:`,
                error
              );
              throw new Error(
                `関心分野の更新中にエラーが発生しました: ${interestName}`
              );
            }
          })
        );
      }

      // 関心分野の更新
      // if (interests) {
      //   // 既存の関心分野を削除
      //   await tx.userInterest.deleteMany({
      //     where: { userId: updatedUser.id },
      //   });

      //   // 新しい関心分野を追加（重複を防ぐため、小文字に変換）
      //   const uniqueInterests = [
      //     ...new Set(interests.map((i) => i.toLowerCase())),
      //   ];
      //   for (const interestName of uniqueInterests) {
      //     try {
      //       // タグが存在しない場合は作成
      //       const tag = await tx.tag.upsert({
      //         where: { name: interestName },
      //         create: { name: interestName },
      //         update: {},
      //       });

      //       // ユーザー関心分野を追加
      //       await tx.userInterest.create({
      //         data: {
      //           userId: updatedUser.id,
      //           tagId: tag.id,
      //         },
      //       });
      //     } catch (error) {
      //       console.error(
      //         `関心分野 "${interestName}" の追加中にエラーが発生しました:`,
      //         error
      //       );
      //       throw new Error(
      //         `関心分野の更新中にエラーが発生しました: ${interestName}`
      //       );
      //     }
      //   }
      // }
      revalidateUserData(session.user.id);
      return updatedUser;
    });

    const formattedUser: ApiUser = {
      id: user.id,
      name: user.name,
      image: user.image,
      topImage: user.topImage,
      selfIntroduction: user.selfIntroduction,
      age: user.age,
      ageVisible: user.ageVisible,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      skills: user.userSkills.map((skill) => ({
        id: String(skill.tag.id),
        name: skill.tag.name,
      })),
      interests: user.userInterests.map((interest) => ({
        id: String(interest.tag.id),
        name: interest.tag.name,
      })),
    };

    // キャッシュの再検証
    // revalidateTag(CACHE_TAGS.USER);
    // revalidateTag(CACHE_TAGS.USER_PROFILE);
    // revalidateTag(`${CACHE_TAGS.USER}-${session.user.id}`);
    revalidateUserData(session.user.id);

    return createApiResponse(formattedUser);
  } catch (error) {
    console.error("ユーザー情報の更新中にエラーが発生しました:", error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0].message);
    }
    return createErrorResponse(
      "ユーザー情報の更新中にエラーが発生しました",
      500
    );
  }
}
