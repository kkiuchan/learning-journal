import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "認証トークンが必要です" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
        userId: string;
        email: string;
        name: string;
        primaryAuthMethod: string;
      };

      // ユーザーが存在するかチェック
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          primaryAuthMethod: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "ユーザーが見つかりません" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        valid: true,
        user,
      });
    } catch (jwtError) {
      return NextResponse.json(
        { error: "無効なトークンです" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("トークン検証エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
