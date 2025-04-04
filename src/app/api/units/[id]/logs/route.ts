import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logRequestSchema } from "@/types/log";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = logRequestSchema.parse(body);

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

    revalidatePath(`/units/${unit.id}`);
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

    const logs = await prisma.log.findMany({
      where: {
        unitId: unit.id,
      },
      include: {
        logTags: {
          include: {
            tag: true,
          },
        },
        resources: true,
      },
      orderBy: {
        logDate: "desc",
      },
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
