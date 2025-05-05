import { prisma } from "@/lib/prisma";
import { Unit } from "@/types";

export async function getUnit(id: string): Promise<{ data: Unit }> {
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

  // Unit型に合わせてデータを整形
  const data: Unit = {
    id: unit.id,
    title: unit.title,
    learningGoal: unit.learningGoal,
    preLearningState: unit.preLearningState,
    reflection: unit.reflection,
    nextAction: unit.nextAction,
    status: unit.status as "PLANNED" | "IN_PROGRESS" | "COMPLETED",
    startDate: unit.startDate?.toISOString() || null,
    endDate: unit.endDate?.toISOString() || null,
    displayFlag: unit.displayFlag,
    createdAt: unit.createdAt.toISOString(),
    achievementLevel: unit.achievementLevel || 0,
    totalLearningTime,
    isLiked: false,
    unitTags: unit.unitTags,
    _count: unit._count,
    userId: unit.userId,
    user: unit.user,
    logs: unit.logs.map((log) => ({
      ...log,
      logDate: log.logDate.toISOString(),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    })),
  };

  return { data };
}
