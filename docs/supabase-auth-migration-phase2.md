# Phase 2: Supabase Auth移行ガイド

## 📋 概要

Phase 1のメールベースStripe統合が完了したため、Phase 2ではNextAuth（JWT）からSupabase Authへの移行を実行します。

## 🎯 移行目標

- NextAuth認証システムからSupabase Authへの完全移行
- PrismaユーザーIDをcuidからUUIDに変更
- Web/モバイル認証の統合基盤構築
- 既存のStripe統合との互換性維持

## 📝 移行計画

### **Step 1: Supabase Auth設定**

#### 1.1 環境変数の追加

```env
# 既存のSupabase設定（ファイルアップロード用）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 新規追加（Auth用）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

#### 1.2 Supabaseプロジェクトでの認証設定

**認証プロバイダーの有効化:**

1. Google OAuth（既存）
2. GitHub OAuth（既存）
3. Discord OAuth（既存）
4. メール/パスワード認証（新規）

**リダイレクトURL設定:**

```
# 開発環境
http://localhost:3000/auth/callback

# 本番環境
https://your-domain.com/auth/callback
```

### **Step 2: Prismaスキーマの変更**

#### 2.1 Userモデルの更新

```prisma
model User {
  // ID変更：cuid → UUID
  id String @id @default(uuid()) @db.Uuid

  // Supabase Auth関連
  authUserId String? @unique // Supabase User ID

  // 既存フィールド（メールベース管理維持）
  email String @unique
  name String?
  image String?

  // その他既存フィールドは変更なし
  // ...
}
```

#### 2.2 関連テーブルの更新

```prisma
// 外部キーをUUIDに変更
model LearningUnit {
  id String @id @default(uuid()) @db.Uuid
  userId String @db.Uuid // UUID変更
  user User @relation(fields: [userId], references: [id])
  // ...
}

model Exercise {
  id String @id @default(uuid()) @db.Uuid
  userId String @db.Uuid // UUID変更
  user User @relation(fields: [userId], references: [id])
  // ...
}
```

### **Step 3: 認証システムの実装**

#### 3.1 Supabase Authクライアントの設定

```typescript
// src/lib/supabase-auth.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAuth = createClient(
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
```

#### 3.2 認証ヘルパー関数

```typescript
// src/lib/auth-helpers.ts
export async function getSupabaseUser() {
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  return user;
}

export async function syncUserWithPrisma(supabaseUser: any) {
  // Supabaseユーザー情報をPrismaと同期
  // メールアドレスをキーとして使用
}
```

### **Step 4: APIの更新**

#### 4.1 認証ミドルウェアの変更

```typescript
// NextAuth → Supabase Auth
export async function getServerSession() {
  // Supabase Auth実装
}
```

#### 4.2 保護されたAPIルートの更新

- 全ての認証チェックをSupabase Authに変更
- ユーザー特定ロジックの更新（ID → UUID）

### **Step 5: フロントエンドの更新**

#### 5.1 認証プロバイダーの置き換え

```typescript
// pages/_app.tsx
// NextAuth SessionProvider → Supabase AuthProvider
```

#### 5.2 ログイン/ログアウト処理

```typescript
// ログイン
const { data, error } = await supabaseAuth.auth.signInWithOAuth({
  provider: "google",
});

// ログアウト
const { error } = await supabaseAuth.auth.signOut();
```

### **Step 6: データ移行**

#### 6.1 既存ユーザーデータの移行

```sql
-- UUIDへの変換準備
ALTER TABLE "User" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- 関連テーブルの更新
-- ...

-- 最終的なID切り替え
ALTER TABLE "User" DROP COLUMN id;
ALTER TABLE "User" RENAME COLUMN new_id TO id;
```

#### 6.2 Stripe Customer IDの連携確認

- メールベース管理により、ID変更の影響なし
- 既存のStripe統合は継続動作

## 🔒 安全な移行手順

### **段階的移行アプローチ**

#### Phase 2A: 準備段階

1. ✅ Supabase Auth設定の完了
2. ✅ Prismaスキーマの準備
3. ✅ 認証システムの実装（並行稼働）

#### Phase 2B: 切り替え段階

4. ✅ フロントエンドの更新
5. ✅ データ移行の実行
6. ✅ NextAuthコードの削除

#### Phase 2C: 検証段階

7. ✅ 全機能のテスト
8. ✅ Stripe統合の確認
9. ✅ パフォーマンス検証

## ⚠️ 重要な注意点

### **後方互換性の確保**

- 移行期間中は両認証システムを並行稼働
- メールアドレスを共通キーとして使用
- Stripe統合はPhase 1で安定化済み

### **ロールバック計画**

- データベースバックアップの作成
- 設定変更の記録
- 段階的ロールバック手順の準備

## 📊 移行後の利点

### **技術的利点**

- ✅ Web/モバイル認証の統一
- ✅ リアルタイム認証状態の同期
- ✅ 高度なセキュリティ機能
- ✅ スケーラビリティの向上

### **開発効率の向上**

- ✅ 認証ロジックの簡素化
- ✅ メンテナンス負荷の軽減
- ✅ React Native統合の容易さ

## 🚀 次のステップ

1. **環境変数の設定確認**
2. **Supabaseプロジェクトの認証設定**
3. **Prismaスキーマの準備**
4. **認証システムの実装開始**

---

Phase 1で確立したメールベースのStripe統合により、ユーザーID変更による影響を最小化できます。安全で段階的な移行により、サービス停止時間なしでSupabase Authへの移行を実現します。
