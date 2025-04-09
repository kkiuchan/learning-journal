import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logRequestSchema } from "@/types/log";
import { revalidateLogData, revalidateUnitData } from "@/utils/cache";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, logId } = await params;

    const log = await prisma.log.findUnique({
      where: { id: parseInt(logId) },
      include: { unit: true },
    });

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    if (log.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    revalidatePath(`/units/${id}`);
    return NextResponse.json({ data: { id: logId } });
  } catch (error) {
    console.error("Error deleting log:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, logId } = await params;
    const body = await request.json();
    const validatedData = logRequestSchema.parse(body);

    const log = await prisma.log.findUnique({
      where: { id: parseInt(logId) },
      include: { unit: true },
    });

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    if (log.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedLog = await prisma.log.update({
      where: { id: parseInt(logId) },
      data: {
        title: validatedData.title,
        learningTime: validatedData.learningTime,
        note: validatedData.note,
        logDate: new Date(validatedData.logDate),
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
    return NextResponse.json({ data: updatedLog });
  } catch (error) {
    console.error("Error updating log:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { id, logId } = await params;

    // セッションの取得（オプショナル）
    const session = await getServerSession(authConfig);

    // ログデータの取得
    const log = await prisma.log.findUnique({
      where: { id: parseInt(logId) },
      include: {
        resources: true,
        logTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // ログが存在しない場合はエラー
    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // ユニットの所有者確認（非公開ログへのアクセス制限）
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true, displayFlag: true },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // 非表示ユニットの場合、所有者のみアクセス可能
    if (!unit.displayFlag && (!session || session.user.id !== unit.userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // レスポンスの加工
    const { logTags, ...restLog } = log;
    const formattedLog = {
      ...restLog,
      tags: logTags.map((lt) => lt.tag),
    };

    return NextResponse.json({ data: formattedLog });
  } catch (error) {
    console.error("Error fetching log:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
