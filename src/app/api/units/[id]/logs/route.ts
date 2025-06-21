import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { logRequestSchema } from "@/types/log";
import { revalidateLogData, revalidateUnitData } from "@/utils/server-cache";
// import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
// import sanitizeHtml from "sanitize-html";

export const revalidate = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    if (unit.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = logRequestSchema.parse(body);

    const log = await prisma.log.create({
      data: {
        unitId: unit.id,
        userId: user.id,
        title: validatedData.title,
        learningTime: validatedData.learningTime,
        note: validatedData.note,
        logDate: new Date(validatedData.logDate),
        effectScore: validatedData.effectScore,
        effectType: validatedData.effectType,
        ...(validatedData.tags && {
          logTags: {
            create: validatedData.tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            })),
          },
        }),
        ...(validatedData.resources && {
          resources: {
            create: validatedData.resources,
          },
        }),
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
    // revalidateTag(`${CACHE_TAGS.LOG}-${log.id}`);
    // revalidateTag(CACHE_TAGS.UNIT);
    // revalidateTag(CACHE_TAGS.UNIT_LIST);
    // revalidateTag(`${CACHE_TAGS.UNIT}-${id}`);
    revalidateLogData(log.id);
    revalidateUnitData(id);

    return NextResponse.json({ data: log });
  } catch (error) {
    console.error("Error creating log:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensurePrismaConnected();
  try {
    const { id } = await params;

    // 現在のユーザーを取得（オプショナル）
    const user = await getCurrentUserUnified();
    const currentUserId = user?.id;

    const logs = await prisma.log.findMany({
      where: {
        unitId: parseInt(id),
      },
      orderBy: {
        logDate: "desc",
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

    // レスポンスの整形
    const formattedLogs = logs.map((log) => ({
      ...log,
      tags: log.logTags.map((logTag) => logTag.tag),
      logTags: undefined,
    }));

    return createApiResponse(formattedLogs);
  } catch (error) {
    console.error("ログ取得エラー:", error);
    return createErrorResponse("ログの取得中にエラーが発生しました", 500);
  }
}
