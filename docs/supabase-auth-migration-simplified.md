# Supabase Auth移行戦略（簡潔版）

## 🎯 基本方針

**User.idを直接Supabase auth.users.idと同じUUID値にする**

- ✅ シンプルな設計
- ✅ データ整合性の確保
- ✅ 一意識別子の統一
- ✅ 関連テーブルも一括でUUID化

## 📝 修正された移行計画

### **Step 1: Prismaスキーマの最終形**

```prisma
model User {
  // IDを直接UUIDに変更（Supabase auth.users.idと同じ値）
  id String @id @db.Uuid

  // 既存フィールド（変更なし）
  name String?
  email String @unique
  image String?

  // Stripe関連（Phase 1で対応済み）
  stripeCustomerId String? @unique
  stripeSubscriptionId String? @unique
  subscriptionStatus String?
  subscriptionPlan String?

  // 関連（すべてUUIDに統一）
  units Unit[]
  logs Log[]
  comments Comment[]
  // ...
}

model Unit {
  id Int @id @default(autoincrement())
  userId String @db.Uuid  // UUIDに変更
  user User @relation(fields: [userId], references: [id])
  // ...
}

model Log {
  id Int @id @default(autoincrement())
  userId String @db.Uuid  // UUIDに変更
  user User @relation(fields: [userId], references: [id])
  // ...
}
```

### **Step 2: 移行プロセス**

#### 2.1 新規ユーザー（Supabase Auth）

```typescript
// 新規ユーザー作成時
export async function createUserFromSupabaseAuth(authUser: any) {
  return await prisma.user.create({
    data: {
      id: authUser.id, // 直接Supabase UUIDを使用
      email: authUser.email,
      name: authUser.user_metadata?.name,
      primaryAuthMethod: "supabase",
    },
  });
}
```

#### 2.2 既存ユーザーの移行

```typescript
// 既存ユーザーの段階的移行
export async function migrateExistingUserToSupabase(
  email: string,
  newSupabaseUserId: string
) {
  // 1. 新しいUUIDでユーザーデータを複製
  const existingUser = await prisma.user.findUnique({ where: { email } });

  // 2. 新しいUUIDでユーザーを作成
  const newUser = await prisma.user.create({
    data: {
      id: newSupabaseUserId, // Supabase UUID
      ...existingUser,
      email: existingUser.email,
    },
  });

  // 3. 関連データを新しいUUIDに移行
  await migrateUserRelatedData(existingUser.id, newSupabaseUserId);

  // 4. 古いユーザーデータを削除
  await prisma.user.delete({ where: { id: existingUser.id } });
}
```

### **Step 3: Stripe統合の維持**

```typescript
// Phase 1で確立したメールベース管理により影響なし
const customer = await getUserByStripeCustomer(customerId);
// ↓ 新しいUUID IDでも同じように動作
const user = await prisma.user.findUnique({
  where: { email: customerEmail },
});
```

## 🚀 実装手順

### **段階的移行**

#### Phase 2A: 準備

1. **Supabase Auth設定**
2. **新規ユーザーフロー実装**（UUID使用）
3. **既存ユーザーとの並行稼働**

#### Phase 2B: 移行

4. **既存ユーザーの段階的UUID移行**
5. **データ整合性の確認**
6. **NextAuth削除**

#### Phase 2C: 最適化

7. **パフォーマンス最適化**
8. **RLS設定**
9. **監視・ログ設定**

## 💡 この設計の利点

### **シンプルさ**

- ✅ 単一のID管理
- ✅ 明確なデータ構造
- ✅ 理解しやすいコード

### **整合性**

- ✅ Supabase Authとの完全同期
- ✅ 一意識別子の統一
- ✅ データ不整合の排除

### **効率性**

- ✅ 複雑な同期処理不要
- ✅ 高速なクエリ実行
- ✅ メンテナンス負荷軽減

---

**結論**: `User.id = auth.users.id`の直接的な設計により、よりシンプルで効率的な認証システムが実現できます。
