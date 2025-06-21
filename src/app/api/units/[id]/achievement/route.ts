import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidateUnitData } from "@/utils/server-cache";
import { NextRequest } from "next/server";
import { z } from "zod";

const achievementSchema = z.object({
  achievementLevel: z.number().min(0).max(100),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const { id } = await params;
    const user = await getCurrentUserUnified();

    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // ユニットの存在確認と権限チェック
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, userId: true, status: true },
    });

    if (!unit) {
      return createErrorResponse("ユニットが見つかりません", 404);
    }

    if (unit.userId !== user.id) {
      return createErrorResponse("このユニットを更新する権限がありません", 403);
    }

    // ステータスを完了に更新
    const updatedUnit = await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        status: "COMPLETED",
        endDate: new Date(),
      },
    });

    // キャッシュの再検証
    revalidateUnitData(id);

    return createApiResponse({
      id: updatedUnit.id,
      status: updatedUnit.status,
      endDate: updatedUnit.endDate,
    });
  } catch (error) {
    console.error("Error updating unit achievement:", error);
    return createErrorResponse(
      "ユニットの達成更新中にエラーが発生しました",
      500
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    const { id } = await params;
    if (!id) {
      return createErrorResponse("ユニットIDが必要です", 400);
    }

    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!unit) {
      return createErrorResponse("ユニットが見つかりません", 404);
    }

    if (unit.userId !== user.id) {
      return createErrorResponse("権限がありません", 403);
    }

    const body = await request.json();
    const validatedData = achievementSchema.parse(body);

    // 達成度に応じてステータスを自動的に更新
    let status = "PLANNED";
    if (
      validatedData.achievementLevel > 0 &&
      validatedData.achievementLevel < 100
    ) {
      status = "IN_PROGRESS";
    } else if (validatedData.achievementLevel === 100) {
      status = "COMPLETED";
    }

    const updatedUnit = await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        achievementLevel: validatedData.achievementLevel,
        status: status,
      },
    });

    if (!updatedUnit) {
      throw new Error("更新に失敗しました");
    }

    const refreshedUnit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
    });

    // キャッシュの再検証
    revalidateUnitData(id);

    return createApiResponse(refreshedUnit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse("入力データが不正です", 400);
    }

    console.error("Error updating achievement level:", error);
    return createErrorResponse("達成度の更新中にエラーが発生しました", 500);
  }
}
