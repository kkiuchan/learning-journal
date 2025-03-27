"use server";

import { prisma } from "@/lib/prisma";

export async function createLog(data: {
  unitId: number;
  userId: number;
  title: string;
  learningTime?: number;
  note?: string;
  logDate: Date;
}) {
  const log = await prisma.log.create({
    data: { ...data },
  });
  return log;
}

export async function updateLog(
  logId: number,
  data: Partial<{
    title: string;
    learningTime: number;
    note: string;
    logDate: Date;
  }>
) {
  const log = await prisma.log.update({
    where: { id: logId },
    data,
  });
  return log;
}

export async function deleteLog(logId: number) {
  const log = await prisma.log.delete({
    where: { id: logId },
  });
  return log;
}
