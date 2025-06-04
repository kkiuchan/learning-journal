# Phase 2: Supabase統合Auth移行ガイド（修正版）

## 📋 現状の再確認

**既存のSupabase活用状況:**

- ✅ **PostgreSQLデータベース**: ユーザー、ユニット、学習ログなど全てのデータ
- ✅ **Storage**: プロフィール画像、リソースファイル
- 🔄 **Auth**: 今回の移行対象（NextAuth → Supabase Auth）

**技術スタック:**

- Supabase PostgreSQL（メインDB）
- Prisma（スキーマ管理・ORM）
- NextAuth（現在） → Supabase Auth（移行後）

## 🎯 修正された移行目標

- NextAuth（JWT）からSupabase Authへの移行
- `public.User`テーブルと`auth.users`テーブルの連携
- UUIDベースのユーザー管理への統一
- 既存のStripe統合との互換性維持
- Supabase RLS（Row Level Security）の活用

## 📝 修正された移行計画

### **Step 1: Supabase Auth有効化とRLS設定**

#### 1.1 Supabase Dashboardでの設定

```sql
-- auth.usersテーブルは自動で有効化される
-- public.Userテーブルとの連携設定

-- 1. authUserIdカラムを追加
ALTER TABLE public."User"
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- 2. 一意制約を追加
CREATE UNIQUE INDEX user_auth_user_id_unique
ON public."User"(auth_user_id);

-- 3. RLS（Row Level Security）を有効化
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 4. ユーザー自身のデータのみアクセス可能にするポリシー
CREATE POLICY "Users can view own data" ON public."User"
FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data" ON public."User"
FOR UPDATE USING (auth.uid() = auth_user_id);
```

#### 1.2 環境変数の追加

```env
# 既存のSupabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 新規追加（Auth管理用）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

### **Step 2: Prismaスキーマの更新**

#### 2.1 User モデルの段階的更新

```prisma
model User {
  // 既存ID（当面維持、後で移行）
  id String @id @default(cuid())

  // Supabase Auth連携用（新規追加）
  authUserId String? @unique @map("auth_user_id") @db.Uuid

  // 既存フィールド（変更なし）
  name String?
  email String @unique
  image String?

  // Stripe関連（Phase 1で対応済み）
  stripeCustomerId String? @unique
  stripeSubscriptionId String? @unique
  subscriptionStatus String?
  subscriptionPlan String?

  // 関連（変更なし）
  units Unit[]
  logs Log[]
  comments Comment[]
  // ...
}
```

### **Step 3: Supabase Auth実装**

#### 3.1 認証クライアントの設定

```typescript
// src/lib/supabase-auth.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// サーバーサイド用（Service Role）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

#### 3.2 ユーザー同期システム

```typescript
// src/lib/user-sync.ts
import { supabaseAdmin } from "./supabase-auth";
import { prisma } from "./prisma";

export async function syncSupabaseUserWithPrisma(authUser: any) {
  if (!authUser?.email) return null;

  // 1. メールベースで既存ユーザーを検索
  let user = await prisma.user.findUnique({
    where: { email: authUser.email },
  });

  if (user) {
    // 2. 既存ユーザーにauth_user_idを設定
    if (!user.authUserId) {
      user = await prisma.user.update({
        where: { email: authUser.email },
        data: { authUserId: authUser.id },
      });
    }
  } else {
    // 3. 新規ユーザーを作成
    user = await prisma.user.create({
      data: {
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split("@")[0],
        image: authUser.user_metadata?.avatar_url,
        authUserId: authUser.id,
        primaryAuthMethod: "supabase",
      },
    });
  }

  return user;
}
```

### **Step 4: 認証フローの実装**

#### 4.1 ログイン処理

```typescript
// src/app/login/page.tsx
export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGitHubLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };
}
```

#### 4.2 認証コールバック

```typescript
// src/app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-auth'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (data.session) {
        // ユーザー同期API呼び出し
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        })

        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return <div>認証処理中...</div>
}
```

### **Step 5: API保護の更新**

#### 5.1 認証ミドルウェア

```typescript
// src/lib/auth-middleware.ts
import { supabaseAdmin } from "./supabase-auth";

export async function getSupabaseUser(token: string) {
  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  const user = await getSupabaseUser(token);

  if (!user) {
    throw new Error("Invalid token");
  }

  return user;
}
```

### **Step 6: データ移行戦略**

#### 6.1 段階的移行アプローチ

**Phase 2A: 並行稼働期間**

- NextAuthとSupabase Auth両方が利用可能
- 新規ユーザーはSupabase Auth
- 既存ユーザーは徐々にSupabase Authに移行

**Phase 2B: 移行促進期間**

- 既存ユーザーにSupabase Auth移行を促進
- データの整合性確認

**Phase 2C: 完全移行**

- NextAuth関連コードの削除
- cuid IDからUUID IDへの変更

#### 6.2 最終的なUUID移行

```sql
-- 最終段階でcuid → UUIDに変更
-- 1. 新しいUUID IDカラム追加
ALTER TABLE public."User" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- 2. 全関連テーブルの外部キー更新
-- Unit, Log, Comment等のuserIdを新しいUUIDに変更

-- 3. 最終的な切り替え
ALTER TABLE public."User" DROP COLUMN id;
ALTER TABLE public."User" RENAME COLUMN new_id TO id;
ALTER TABLE public."User" ADD PRIMARY KEY (id);
```

## 🔒 RLS（Row Level Security）設定

### 主要テーブルのRLS設定

```sql
-- Unit テーブル
ALTER TABLE public."Unit" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own units" ON public."Unit"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public."User"
    WHERE public."User".id = public."Unit"."userId"
    AND public."User".auth_user_id = auth.uid()
  )
);

-- Log テーブル
ALTER TABLE public."Log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own logs" ON public."Log"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public."User"
    WHERE public."User".id = public."Log"."userId"
    AND public."User".auth_user_id = auth.uid()
  )
);
```

## 🚀 実装順序

1. **Supabase Auth設定とRLS有効化**
2. **認証システムの実装（並行稼働）**
3. **ユーザー同期システムの構築**
4. **API保護の段階的移行**
5. **フロントエンドの更新**
6. **データ移行とUUID変換**
7. **NextAuthコードの削除**

---

**重要**: Supabaseを統合基盤として使用することで、認証・データベース・ストレージが一元管理され、より堅牢で効率的な学習ジャーナルシステムが実現できます。
