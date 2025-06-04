# Supabase Auth完全移行（クリーン版）

## 🎯 基本方針

**既存NextAuthユーザーを削除し、Supabase Authに完全移行**

- ✅ 既存User削除：NextAuthユーザーデータを削除
- ✅ 新規作成：Supabase auth.users.idで新規User作成
- ✅ データ引き継ぎ：メールベースでStripe等のデータ引き継ぎ
- ✅ 統一管理：全ユーザーがSupabase UUID

## 📝 移行計画

### **Step 1: 移行前の準備**

#### 1.1 既存ユーザーデータの確認

```typescript
// 移行対象ユーザーの確認
export async function checkMigrationData() {
  const users = await prisma.user.findMany({
    where: { primaryAuthMethod: "nextauth" },
    include: {
      units: { select: { _count: true } },
      logs: { select: { _count: true } },
      stripeCustomerId: true,
    },
  });

  console.log("移行対象ユーザー:", users.length);
  return users;
}
```

#### 1.2 重要データのバックアップ

```typescript
// 必要に応じて学習データをエクスポート
export async function backupUserLearningData(userId: string) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      units: true,
      logs: true,
      comments: true,
    },
  });

  // JSON形式でバックアップ保存
  return userData;
}
```

### **Step 2: 移行プロセス**

#### 2.1 ユーザーの新規作成（Supabase Auth）

```typescript
export async function migrateUserToSupabase(email: string) {
  // 1. 既存ユーザーを確認
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    console.log("移行対象ユーザーが見つかりません:", email);
    return null;
  }

  // 2. Supabase Auth経由でユーザーが認証済みかチェック
  // （フロントエンドで事前に認証してもらう）

  // 3. 既存ユーザーを削除
  await prisma.user.delete({
    where: { id: existingUser.id },
  });

  console.log("既存ユーザーを削除しました:", email);

  // 4. 新規ユーザーは自動的にSupabase Auth認証時に作成される
  return { migrated: true, email };
}
```

#### 2.2 新規ユーザー作成（自動）

```typescript
// Supabase Auth認証時に自動実行
export async function createUserFromSupabaseAuth(authUser: any) {
  // 既存のStripe Customerがあるかチェック
  const existingCustomer = await findStripeCustomerByEmail(authUser.email);

  const user = await prisma.user.create({
    data: {
      id: authUser.id, // Supabase UUID
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email.split("@")[0],
      image: authUser.user_metadata?.avatar_url,
      primaryAuthMethod: "supabase",
      // Stripe情報を引き継ぎ
      stripeCustomerId: existingCustomer?.id || null,
    },
  });

  // 新規の場合はStripe Customer作成
  if (!existingCustomer) {
    await createOrRetrieveStripeCustomer(user.email, user.name);
  }

  return user;
}
```

### **Step 3: Prismaスキーマの最終形**

```prisma
model User {
  id String @id  // 全てSupabase UUID
  name String?
  email String @unique
  image String?
  primaryAuthMethod String @default("supabase")

  // Stripe関連（Phase 1で対応済み）
  stripeCustomerId String? @unique
  stripeSubscriptionId String? @unique
  subscriptionStatus String?
  subscriptionPlan String?

  // 関連データ（全て新規作成）
  units Unit[]
  logs Log[]
  comments Comment[]
  // ...
}
```

### **Step 4: 移行手順**

#### 4.1 移行準備期間

1. **ユーザーに移行予告**を送信
2. **重要データのバックアップ**作成
3. **Supabase Auth設定**完了

#### 4.2 移行実行

1. **既存システム停止**（メンテナンス期間）
2. **既存ユーザーデータ削除**
3. **Supabase Auth有効化**
4. **システム再開**

#### 4.3 移行後

1. **ユーザーに再ログイン案内**
2. **新システムでの動作確認**
3. **サポート体制の強化**

## ⚠️ 重要な確認事項

### **データ削除の影響**

- ✅ **学習ユニット**: 削除される（新規作成）
- ✅ **学習ログ**: 削除される（新規作成）
- ✅ **コメント**: 削除される（新規作成）
- ✅ **Stripeデータ**: **メールベースで引き継ぎ**（重要！）

### **ユーザーへの影響**

- ❌ **学習履歴**: リセット
- ❌ **設定**: リセット
- ✅ **サブスクリプション**: 継続
- ✅ **メールアドレス**: 継続

## 💡 この設計の利点

### **シンプルさ**

- ✅ 全ユーザーがSupabase Auth
- ✅ ID管理の統一（全てUUID）
- ✅ 複雑な移行ロジック不要

### **清潔性**

- ✅ 古いデータの蓄積なし
- ✅ 一貫したデータ構造
- ✅ メンテナンス性向上

### **Stripe統合**

- ✅ Phase 1で準備済み
- ✅ メールベース管理で継続
- ✅ 支払い情報は保持

## 🚀 実装タイムライン

1. **Week 1**: 移行システム準備・テスト
2. **Week 2**: ユーザー通知・バックアップ
3. **Week 3**: 移行実行・検証
4. **Week 4**: サポート・安定化

---

**結論**: データリセットを受け入れることで、最もシンプルで効率的なSupabase Auth移行が実現できます。
