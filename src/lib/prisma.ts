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
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒
let lastConnectionAttempt = 0;
const CONNECTION_TIMEOUT = 30000; // 30秒

// 接続状態をリセット
const resetConnectionState = () => {
  isConnected = false;
  connectionPromise = null;
  retryCount = 0;
};

// 接続状態をチェック
const checkConnection = async (): Promise<boolean> => {
  try {
    // 簡単なクエリを実行して接続状態を確認
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.log("❌ Connection check failed:", error);
    return false;
  }
};

// 必要なときに呼び出す接続関数
export const ensurePrismaConnected = async () => {
  // 前回の接続試行から30秒以上経過している場合は接続状態をリセット
  if (Date.now() - lastConnectionAttempt > CONNECTION_TIMEOUT) {
    resetConnectionState();
  }

  // 接続状態を確認
  if (isConnected) {
    const isStillConnected = await checkConnection();
    if (!isStillConnected) {
      resetConnectionState();
    } else {
      return;
    }
  }

  // 接続処理が進行中の場合
  if (connectionPromise) {
    try {
      await connectionPromise;
      return;
    } catch (error) {
      resetConnectionState();
    }
  }

  const connect = async (): Promise<void> => {
    try {
      console.log(
        `🔄 Attempting to connect to database... (attempt ${
          retryCount + 1
        }/${MAX_RETRIES})`
      );
      await prisma.$connect();
      isConnected = true;
      retryCount = 0;
      lastConnectionAttempt = Date.now();
      console.log("✅ Database connection established");
    } catch (error) {
      console.error("❌ Database connection error:", error);
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return connect();
      }
      resetConnectionState();
      throw error;
    }
  };

  try {
    connectionPromise = connect();
    await connectionPromise;
  } catch (error) {
    throw error;
  } finally {
    connectionPromise = null;
  }
};
