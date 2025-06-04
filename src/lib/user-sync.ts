import { User } from "@prisma/client";
import { prisma } from "./prisma";
import { createOrRetrieveStripeCustomer } from "./stripe-utils";
import { supabaseAdmin } from "./supabase-auth";

export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
};

/**
 * Supabase AuthユーザーをPrismaと同期する関数
 * User.idを直接Supabase UUIDとして使用
 */
export async function syncSupabaseUserWithPrisma(
  authUser: SupabaseUser
): Promise<User | null> {
  if (!authUser?.email || !authUser?.id) {
    console.error("Supabase user missing email or id:", authUser);
    return null;
  }

  console.log("Syncing Supabase user with Prisma:", {
    id: authUser.id,
    email: authUser.email,
  });

  try {
    // 1. IDで既存ユーザーを検索（優先）
    let user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (user) {
      console.log("User found by ID:", user.email);
      return user;
    }

    // 2. メールベースで既存ユーザーを検索（移行用）
    user = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (user) {
      console.log("Found existing user by email, needs migration:", user.email);
      // 既存ユーザーの移行は別の処理で実装
      // ここでは新規ユーザーとして作成しない
      return null;
    }

    // 3. 新規ユーザーを作成（Supabase UUIDをそのまま使用）
    console.log("Creating new user with Supabase UUID:", authUser.email);

    const userName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email.split("@")[0];

    const provider = authUser.app_metadata?.provider || "supabase";

    user = await prisma.user.create({
      data: {
        id: authUser.id, // 直接Supabase UUIDを使用
        email: authUser.email,
        name: userName,
        image: authUser.user_metadata?.avatar_url || null,
        primaryAuthMethod: provider,
        subscriptionStatus: null,
        subscriptionPlan: null,
      },
    });

    console.log("New user created with UUID:", user.id);

    // 4. 新規ユーザーの場合、Stripe Customerも作成
    try {
      await createOrRetrieveStripeCustomer(user.email, user.name || undefined);
      console.log("Stripe customer created for new user:", user.email);
    } catch (error) {
      console.error("Failed to create Stripe customer:", error);
      // Stripe作成エラーでもユーザー作成は継続
    }

    return user;
  } catch (error) {
    console.error("Failed to sync Supabase user with Prisma:", error);
    return null;
  }
}

/**
 * トークンからSupabaseユーザーを取得してPrismaと同期
 */
export async function syncUserFromToken(token: string): Promise<User | null> {
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !authUser) {
      console.error("Failed to get user from token:", error);
      return null;
    }

    return await syncSupabaseUserWithPrisma(authUser);
  } catch (error) {
    console.error("Failed to sync user from token:", error);
    return null;
  }
}

/**
 * 既存ユーザーをSupabase Authに移行（別途実装予定）
 * cuid → UUID への移行処理
 */
export async function migrateExistingUserToSupabase(
  email: string,
  newSupabaseUserId: string
): Promise<User | null> {
  // 後で実装：既存のcuidユーザーを新しいUUIDに移行
  console.log("Migration needed for:", email, "to UUID:", newSupabaseUserId);
  return null;
}

/**
 * UUIDからPrismaユーザーを取得
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    console.error("Failed to get user by id:", error);
    return null;
  }
}
