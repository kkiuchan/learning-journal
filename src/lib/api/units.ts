import { prisma } from "@/lib/prisma";
import { UnitDTO } from "@/types/unit";

export async function getUnit(id: string): Promise<{ data: UnitDTO }> {
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    throw new Error("無効なユニットIDです");
  }

  const unit = await prisma.unit.findUnique({
    where: { id: numericId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      unitTags: {
        include: {
          tag: true,
        },
      },
      logs: {
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
      },
      _count: {
        select: {
          logs: true,
          unitLikes: true,
          comments: true,
        },
      },
    },
  });

  if (!unit) {
    throw new Error("ユニットが見つかりません");
  }

  // 総学習時間を計算
  const totalLearningTime = unit.logs.reduce(
    (total, log) => total + (log.learningTime || 0),
    0
  );

  // UnitDTO型に合わせてデータを整形
  const data: UnitDTO = {
    id: unit.id,
    userId: unit.userId,
    title: unit.title,
    learningGoal: unit.learningGoal,
    preLearningState: unit.preLearningState,
    reflection: unit.reflection,
    nextAction: unit.nextAction,
    achievementLevel: unit.achievementLevel,
    startDate: unit.startDate?.toISOString() || null,
    endDate: unit.endDate?.toISOString() || null,
    status: unit.status as "PLANNED" | "IN_PROGRESS" | "COMPLETED",
    displayFlag: unit.displayFlag,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString(),
    user: unit.user,
    tags: unit.unitTags.map(({ tag }) => tag),
    _count: {
      ...unit._count,
      // 必要ならtotalLearningTimeを_countに含める
      totalLearningTime,
    },
    isLiked: false, // 必要に応じて実装
  };

  return { data };
}
