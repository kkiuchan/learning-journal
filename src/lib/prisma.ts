// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// グローバルスコープで PrismaClient を再利用
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
// 接続状態を追跡
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

// 必要なときに呼び出す接続関数
export const ensurePrismaConnected = async () => {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;

  console.log("🔄 Attempting to connect to database...");

  connectionPromise = prisma
    .$connect()
    .then(() => {
      isConnected = true;
      console.log("✅ Database connection established");
    })
    .catch((error) => {
      console.error("❌ Database connection error:", error);
      isConnected = false;
      throw error; // エラーを再スロー
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
};
