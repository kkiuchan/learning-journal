"use server";

import { prisma } from "@/lib/prisma";

export async function createUnit(data: {
  userId: number;
  title: string;
  learningGoal?: string;
  preLearningState?: string;
  reflection?: string;
  nextAction?: string;
  startDate?: Date;
  endDate?: Date;
  status: string; // '計画中', '進行中', '完了'
  likesCount?: number;
}) {
  const unit = await prisma.unit.create({
    data: { ...data },
  });
  return unit;
}

export async function updateUnit(
  unitId: number,
  data: Partial<{
    title: string;
    learningGoal: string;
    preLearningState: string;
    reflection: string;
    nextAction: string;
    startDate: Date;
    endDate: Date;
    status: string;
    likesCount: number;
  }>
) {
  const unit = await prisma.unit.update({
    where: { id: unitId },
    data,
  });
  return unit;
}

export async function deleteUnit(unitId: number) {
  const unit = await prisma.unit.delete({
    where: { id: unitId },
  });
  return unit;
}
