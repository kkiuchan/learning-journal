// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// グローバルスコープで PrismaClient を再利用
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// コンストラクタの呼び出しを追跡
let clientCount = 0;
let connectionCount = 0;
let disconnectCount = 0;

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    clientCount++;
    console.log(
      `🔄 Creating new Prisma client instance (count: ${clientCount})`
    );
    return new PrismaClient({
      log: ["query", "error", "warn"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 接続状態を追跡
let isConnected = false;
let isDisconnecting = false;
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

// シャットダウン処理を一度だけ実行するための関数
const shutdownOnce = (() => {
  let isShuttingDown = false;
  let lastShutdownTime = 0;
  const SHUTDOWN_COOLDOWN = 1000; // 1秒のクールダウン期間

  return async () => {
    const now = Date.now();
    if (isShuttingDown || now - lastShutdownTime < SHUTDOWN_COOLDOWN) return;

    isShuttingDown = true;
    lastShutdownTime = now;

    if (!isConnected || isDisconnecting) return;

    isDisconnecting = true;
    disconnectCount++;
    const currentDisconnectCount = disconnectCount;
    console.log(
      `🧹 Starting disconnect (disconnect count: ${currentDisconnectCount})`
    );

    try {
      await prisma.$disconnect();
      isConnected = false;
      console.log(
        `✅ Prisma disconnected successfully (disconnect count: ${currentDisconnectCount})`
      );
    } catch (error) {
      console.error("❌ Error during Prisma disconnect:", error);
      process.exit(1);
    } finally {
      isDisconnecting = false;
      isShuttingDown = false;
    }
  };
})();

// イベントリスナーを登録（一度だけ）
let isListenerRegistered = false;

if (!isListenerRegistered) {
  isListenerRegistered = true;

  // SIGINT（Ctrl+C）のイベントリスナー
  process.on("SIGINT", () => {
    console.log("Received SIGINT signal");
    shutdownOnce().catch(console.error);
  });

  // SIGTERMのイベントリスナー
  process.on("SIGTERM", () => {
    console.log("Received SIGTERM signal");
    shutdownOnce().catch(console.error);
  });

  // 未処理の例外のイベントリスナー
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdownOnce().catch(console.error);
  });

  // プロセス終了前のイベントリスナー（開発環境では無視）
  if (process.env.NODE_ENV === "production") {
    process.on("beforeExit", () => {
      console.log("Process is about to exit");
      shutdownOnce().catch(console.error);
    });
  }
}
