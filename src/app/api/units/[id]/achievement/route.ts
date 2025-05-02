import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const achievementSchema = z.object({
  achievementLevel: z.number().min(0).max(100),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    if (!id) {
      return NextResponse.json(
        { error: "ユニットIDが必要です" },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "ユニットが見つかりません" },
        { status: 404 }
      );
    }

    if (unit.userId !== session.user.id) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = achievementSchema.parse(body);

    const updatedUnit = await prisma.$executeRaw`
      UPDATE "Unit"
      SET "achievementLevel" = ${validatedData.achievementLevel}
      WHERE id = ${parseInt(id)}
    `;

    if (!updatedUnit) {
      throw new Error("更新に失敗しました");
    }

    const refreshedUnit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ data: refreshedUnit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です" },
        { status: 400 }
      );
    }

    console.error("Error updating achievement level:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
