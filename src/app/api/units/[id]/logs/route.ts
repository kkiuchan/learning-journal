import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logRequestSchema } from "@/types/log";
import { revalidateLogData, revalidateUnitData } from "@/utils/cache";
import { getServerSession } from "next-auth";
// import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    if (unit.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = logRequestSchema.parse(body);

    const log = await prisma.log.create({
      data: {
        unitId: unit.id,
        userId: session.user.id,
        title: validatedData.title,
        learningTime: validatedData.learningTime,
        note: validatedData.note,
        logDate: new Date(validatedData.logDate),
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    if (!unit.displayFlag && unit.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where: {
          unitId: parseInt(id),
        },
        orderBy: {
          logDate: "desc",
        },
        skip,
        take: limit,
        include: {
          logTags: {
            include: {
              tag: true,
            },
          },
          resources: true,
        },
      }),
      prisma.log.count({
        where: {
          unitId: parseInt(id),
        },
      }),
    ]);

    // レスポンスの構築
    const response = {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // キャッシュヘッダーの設定
    const responseObj = NextResponse.json(response);
    responseObj.headers.set(
      "Cache-Control",
      "public, s-maxage=10, stale-while-revalidate=59"
    );

    return responseObj;
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
