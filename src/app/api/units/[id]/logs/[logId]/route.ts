import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logRequestSchema } from "@/types/log";
import { revalidateLogData, revalidateUnitData } from "@/utils/server-cache";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

// キャッシュを無効化してリアルタイム更新を実現
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    const { id, logId } = await params;

    const log = await prisma.log.findUnique({
      where: { id: parseInt(logId) },
      include: { unit: true },
    });

    if (!log) {
      return createErrorResponse("ログが見つかりません", 404);
    }

    if (log.unit.userId !== user.id) {
      return createErrorResponse("このログを削除する権限がありません", 403);
    }

    // トランザクションを使用して、関連するリソースも一緒に削除する
    await prisma.$transaction(async (tx) => {
      // 関連するリソースを削除
      await tx.resource.deleteMany({
        where: { logId: parseInt(logId) },
      });

      // ログのタグ関連を削除
      await tx.logTag.deleteMany({
        where: { logId: parseInt(logId) },
      });

      // ログを削除
      await tx.log.delete({
        where: { id: parseInt(logId) },
      });
    });

    // キャッシュの再検証
    // revalidateTag(CACHE_TAGS.LOG);
    // revalidateTag(CACHE_TAGS.LOG_LIST);
    // revalidateTag(`${CACHE_TAGS.LOG}-${logId}`);
    // revalidateTag(CACHE_TAGS.UNIT);
    // revalidateTag(CACHE_TAGS.UNIT_LIST);
    // revalidateTag(`${CACHE_TAGS.UNIT}-${id}`);
    revalidateLogData(logId);
    revalidateUnitData(id);

    // 強力なキャッシュ無効化
    revalidatePath(`/units/${id}`);
    revalidatePath(`/api/units/${id}/logs`);
    revalidatePath(`/api/units/${id}/logs/${logId}`);

    return createApiResponse({ id: logId });
  } catch (error) {
    console.error("Error deleting log:", error);
    return createErrorResponse("ログの削除中にエラーが発生しました", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { id, logId } = await params;
    const user = await getCurrentUserUnified();

    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // ログの存在確認と権限チェック
    const existingLog = await prisma.log.findUnique({
      where: { id: parseInt(logId) },
      include: {
        unit: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingLog) {
      return createErrorResponse("ログが見つかりません", 404);
    }

    if (existingLog.unit.userId !== user.id) {
      return createErrorResponse("このログを更新する権限がありません", 403);
    }

    const body = await request.json();
    const validatedData = logRequestSchema.parse(body);

    const updatedLog = await prisma.log.update({
      where: { id: parseInt(logId) },
      data: {
        title: validatedData.title,
        learningTime: validatedData.learningTime,
        note: validatedData.note,
        logDate: new Date(validatedData.logDate),
        effectScore: validatedData.effectScore,
        effectType: validatedData.effectType,
        logTags: {
          deleteMany: {},
          create: validatedData.tags?.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          })),
        },
        resources: {
          deleteMany: {},
          create: validatedData.resources?.map((resource) => ({
            resourceType: resource.resourceType || "link",
            resourceLink: resource.resourceLink,
            description: resource.description,
            fileName: resource.fileName,
            filePath: resource.filePath,
          })),
        },
      },
      include: {
        logTags: {
          include: {
            tag: true,
          },
        },
        resources: true,
      },
    });

    // キャッシュの再検証
    // revalidateTag(CACHE_TAGS.LOG);
    // revalidateTag(CACHE_TAGS.LOG_LIST);
    // revalidateTag(`${CACHE_TAGS.LOG}-${logId}`);
    // revalidateTag(CACHE_TAGS.UNIT);
    // revalidateTag(CACHE_TAGS.UNIT_LIST);
    // revalidateTag(`${CACHE_TAGS.UNIT}-${id}`);
    revalidateLogData(logId);
    revalidateUnitData(id);

    revalidatePath(`/units/${id}`);
    return createApiResponse(updatedLog);
  } catch (error) {
    console.error("Error updating log:", error);
    return createErrorResponse("ログの更新中にエラーが発生しました", 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { logId } = await params;
    const user = await getCurrentUserUnified();

    // ログを取得
    const log = await prisma.log.findUnique({
      where: { id: parseInt(logId) },
      include: {
        logTags: {
          include: {
            tag: true,
          },
        },
        resources: true,
        unit: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!log) {
      return createErrorResponse("ログが見つかりません", 404);
    }

    // 権限チェック（自分のユニットのログのみ表示可能）
    if (user?.id !== log.unit.userId) {
      return createErrorResponse("このログを表示する権限がありません", 403);
    }

    // タグの整形
    const formattedLog = {
      ...log,
      tags: log.logTags.map((logTag) => logTag.tag),
      logTags: undefined,
      unit: undefined,
    };

    return createApiResponse(formattedLog);
  } catch (error) {
    console.error("ログ取得エラー:", error);
    return createErrorResponse("ログの取得中にエラーが発生しました", 500);
  }
}
