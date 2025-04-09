import { authConfig } from "@/auth.config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "./api-utils";
import { sanitizeString } from "./security";

/**
 * レート制限のための簡易的なインメモリストア
 * 本番環境では Redis などの外部ストアを使用することを推奨
 */
interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetAt: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * リクエストのレート制限を適用する
 * @param req NextRequest オブジェクト
 * @param limit 制限数（デフォルト: 60）
 * @param windowMs 時間枠（ミリ秒）（デフォルト: 60000 = 1分）
 * @returns レート制限に達した場合は true、それ以外は false
 */
export function applyRateLimit(
  req: NextRequest,
  limit: number = 60,
  windowMs: number = 60000
): boolean {
  // IP アドレスを取得
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const now = Date.now();

  // IP アドレスのレート制限情報を取得または初期化
  if (!rateLimitStore[ip] || rateLimitStore[ip].resetAt < now) {
    rateLimitStore[ip] = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // リクエスト数をインクリメント
  rateLimitStore[ip].count++;

  // リクエスト数が制限を超えた場合は true を返す
  return rateLimitStore[ip].count > limit;
}

/**
 * APIルートのセキュリティを強化するためのミドルウェア関数
 * @param handler API ハンドラ関数
 * @param options オプション
 * @returns セキュリティが適用された API ハンドラ関数
 */
export function withApiSecurity(
  handler: (
    req: NextRequest,
    sessionOrContext?: unknown
  ) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: {
      limit: number;
      windowMs: number;
    };
  } = {}
) {
  return async function (
    req: NextRequest,
    context?: unknown
  ): Promise<NextResponse> {
    // レート制限の適用
    if (options.rateLimit) {
      const { limit, windowMs } = options.rateLimit;
      const isRateLimited = applyRateLimit(req, limit, windowMs);
      if (isRateLimited) {
        return createErrorResponse(
          "レート制限に達しました。しばらく経ってから再試行してください。",
          429
        );
      }
    }

    // 認証チェック
    if (options.requireAuth) {
      const session = await getServerSession(authConfig);
      if (!session) {
        return createErrorResponse("認証が必要です", 401);
      }

      // 認証済みセッションをハンドラに渡す（コンテキストがあれば併せて渡す）
      return context
        ? handler(req, { ...(context as object), session })
        : handler(req, session);
    }

    // 通常のハンドラ実行（コンテキストがあれば優先して渡す）
    return context ? handler(req, context) : handler(req, null);
  };
}

/**
 * リクエストボディの検証とサニタイズを行う
 * @param req NextRequest オブジェクト
 * @param schema Zod スキーマ
 * @returns 検証とサニタイズ済みのデータまたはエラー
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return {
        error: createErrorResponse(`入力値が不正です: ${errorMessage}`, 400),
      };
    }

    return { data: result.data };
  } catch {
    return {
      error: createErrorResponse("リクエストボディの解析に失敗しました", 400),
    };
  }
}

/**
 * 安全なJSONレスポンスを作成する（XSS対策）
 * @param data レスポンスデータ
 * @param status HTTPステータスコード
 * @returns サニタイズされたJSONレスポンス
 */
export function createSafeResponse<T extends Record<string, unknown>>(
  data: T,
  status: number = 200
): NextResponse {
  // 文字列値のサニタイズ
  const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = typeof value === "string" ? sanitizeString(value) : value;
    return acc;
  }, {} as Record<string, unknown>);

  return NextResponse.json(sanitizedData, { status });
}
