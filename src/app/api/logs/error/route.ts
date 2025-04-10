import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const errorLogSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  digest: z.string().optional(),
  url: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
});

export async function POST(request: Request) {
  await ensurePrismaConnected();
  try {
    const body = await request.json();
    const validatedData = errorLogSchema.parse(body);

    // エラーログをデータベースに保存
    await prisma.errorLog.create({
      data: {
        message: validatedData.message,
        stack: validatedData.stack,
        digest: validatedData.digest,
        url: validatedData.url,
        userAgent: validatedData.userAgent,
        timestamp: new Date(validatedData.timestamp),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("エラーログの保存に失敗:", error);
    return NextResponse.json(
      { error: "エラーログの保存に失敗しました" },
      { status: 500 }
    );
  }
}
