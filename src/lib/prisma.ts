// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// グローバルスコープで PrismaClient を再利用
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// コンストラクタの呼び出しを追跡
let connectionCount = 0;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 接続状態を追跡
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

// 接続を確立
const connect = async () => {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;

  connectionCount++;
  console.log(
    `🔄 Attempting to connect (connection count: ${connectionCount})`
  );

  connectionPromise = prisma
    .$connect()
    .then(() => {
      isConnected = true;
      console.log(
        `✅ Prisma connected successfully (connection count: ${connectionCount})`
      );
    })
    .catch((error) => {
      console.error("❌ Prisma connection error:", error);
      isConnected = false;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
};

// 初期接続を確立
connect();

// プロダクション環境でのみシャットダウンハンドラーを設定
if (process.env.NODE_ENV === "production") {
  process.on("SIGINT", () => {
    prisma.$disconnect();
  });

  process.on("SIGTERM", () => {
    prisma.$disconnect();
  });
}
