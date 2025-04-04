import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logRequestSchema } from "@/types/log";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; logId: string } }
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

    await prisma.log.delete({
      where: { id: parseInt(logId) },
    });

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
  { params }: { params: { id: string; logId: string } }
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
            resourceType: "link",
            resourceLink: resource.resourceLink,
            description: resource.description,
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
