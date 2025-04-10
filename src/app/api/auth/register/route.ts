import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types";
import { authRequestSchema } from "@/types/auth";
import bcryptjs from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  await ensurePrismaConnected();
  try {
    const body = await request.json();
    const validatedData = authRequestSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return createErrorResponse(
        "このメールアドレスは既に登録されています",
        400
      );
    }

    const hashedPassword = await bcryptjs.hash(validatedData.password, 10);

    await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        primaryAuthMethod: "email",
      },
    });

    return createApiResponse({
      message: "登録が完了しました。ログインしてください。",
    });
  } catch (error) {
    console.error("登録エラー:", error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0].message);
    }
    return createErrorResponse("登録中にエラーが発生しました", 500);
  }
}
