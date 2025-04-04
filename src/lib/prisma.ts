// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// グローバルスコープで PrismaClient を再利用
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown: アプリ終了時に接続をクリーンに切る
const gracefulShutdown = async () => {
  try {
    console.log("🧹 Prisma disconnecting...");
    await prisma.$disconnect();
    console.log("✅ Prisma disconnected.");
  } catch (error) {
    console.error("❌ Error during Prisma disconnect:", error);
    process.exit(1); // 異常終了
  }
};

// Prisma の接続を確実に閉じるためのイベントリスナー
process.on("beforeExit", gracefulShutdown);
process.on("SIGINT", gracefulShutdown); // Ctrl+C
process.on("SIGTERM", gracefulShutdown); // kill コマンド
process.on("uncaughtException", gracefulShutdown); // 想定外の例外
