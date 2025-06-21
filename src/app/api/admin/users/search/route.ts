import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// 管理者権限チェック
function isAdmin(email: string): boolean {
  const adminEmails = [
    "bandman.gh.bs.dk.lav@gmail.com", // あなたのメールアドレス
    // "friend@example.com", // 知人のメールアドレス（例）
    // "admin@company.com", // 会社の管理者（例）
    // 他の管理者のメールアドレスをここに追加
  ];
  return adminEmails.includes(email);
}

export async function GET(request: NextRequest) {
  // await ensurePrismaConnected();
  try {
    const user = await getCurrentUserUnified();
    if (!user) {
      return createErrorResponse("認証が必要です", 401);
    }

    // 管理者権限チェック
    if (!isAdmin(user.email)) {
      return createErrorResponse("管理者権限が必要です", 403);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const whereCondition = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              units: true,
              logs: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    return createApiResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("ユーザー検索エラー:", error);
    return createErrorResponse("ユーザー検索中にエラーが発生しました", 500);
  }
}
