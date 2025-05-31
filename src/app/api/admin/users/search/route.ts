import { authConfig } from "@/auth.config";
import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
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

export async function GET(req: NextRequest) {
  await ensurePrismaConnected();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // 管理者権限チェック
    if (!isAdmin(session.user.email)) {
      return createErrorResponse("管理者権限が必要です", 403);
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    // ユーザーを検索
    const where = query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          subscriptionStart: true,
          subscriptionEnd: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return createApiResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      query,
    });
  } catch (error) {
    console.error("ユーザー検索エラー:", error);
    return createErrorResponse("ユーザー検索に失敗しました", 500);
  }
}
