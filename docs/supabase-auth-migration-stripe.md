# Supabase Auth移行時のStripe統合改善案

## 🎯 現状の問題

### 従来のStripe統合方式

- **ユーザー特定**: `User.stripeCustomerId` → Stripe Customer
- **Webhook処理**: `invoice.customer` → `User.stripeCustomerId` → User特定
- **サブスクリプション管理**: `User.stripeSubscriptionId` → Stripe Subscription

### 問題点

1. **User IDの変更**: Prisma cuid() → Supabase UUID移行時にIDが変わる
2. **データ整合性**: 既存のStripe Customer IDとの紐付けが切れる
3. **移行の複雑さ**: 過去の決済履歴との整合性確保が困難

---

## ✅ 改善案A: メールアドレス中心管理（推奨）

### **基本方針**

- **一意識別子**: `email`（User、Stripe Customer共通）
- **統合ポイント**: メールアドレスベースでの管理
- **移行方法**: 段階的移行でリスク最小化

### **実装方法**

#### 1. Stripe Customer作成時の改善

```typescript
// 従来
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: { userId: user.id }, // ← IDに依存
});

// 改善後
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: {
    source: "learning-journal",
    userEmail: user.email, // ← emailで管理
    migrationId: user.id, // ← 移行用の一時的ID
  },
});
```

#### 2. Webhook処理の改善

```typescript
// 従来のWebhook処理
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer as string }, // ← IDに依存
  });
}

// 改善後のWebhook処理
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // 1. Stripe CustomerからEmailを取得
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  const customerEmail = (customer as any).email;

  // 2. Emailベースでユーザー特定
  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!user) {
    console.error("User not found for email:", customerEmail);
    return;
  }
}
```

#### 3. 段階的移行戦略

```typescript
// Step 1: デュアル管理（移行期間中）
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { stripeCustomerId: customerId }, // 従来方式
      { email: customerEmail }, // 新方式
    ],
  },
});

// Step 2: Stripe Customer情報の更新
if (user && user.stripeCustomerId !== customerId) {
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customerId },
  });
}
```

### **メリット**

- ✅ **移行リスク最小化**: 既存データを保持しながら移行
- ✅ **データ整合性**: メールアドレスは変更されない一意識別子
- ✅ **過去履歴保持**: 既存の決済履歴を維持
- ✅ **Supabase Auth対応**: UUIDが変わってもメールで特定可能

---

## 📋 改善案B: マッピングテーブル方式

### **基本方針**

- **中間テーブル**: `StripeCustomerMapping`テーブルを作成
- **統合ポイント**: 旧ID→新ID のマッピング管理
- **移行方法**: データマッピングによる完全移行

### **実装方法**

#### 1. マッピングテーブルの作成

```prisma
model StripeCustomerMapping {
  id                String   @id @default(uuid())
  oldUserId         String?  // 移行前のPrisma cuid
  newUserId         String   // 移行後のSupabase UUID
  stripeCustomerId  String   @unique
  email             String
  createdAt         DateTime @default(now())

  @@map("stripe_customer_mapping")
}
```

#### 2. Webhook処理の改善

```typescript
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // 1. マッピングテーブルから現在のUser IDを取得
  const mapping = await prisma.stripeCustomerMapping.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!mapping) {
    console.error("Mapping not found for customer:", invoice.customer);
    return;
  }

  // 2. 現在のUser IDでユーザー特定
  const user = await prisma.user.findUnique({
    where: { id: mapping.newUserId },
  });
}
```

### **メリット**

- ✅ **完全なデータ追跡**: 移行前後のID関係を完全管理
- ✅ **複数環境対応**: テスト・本番環境の違いにも対応
- ✅ **将来対応**: 今後のID変更にも柔軟対応

### **デメリット**

- ❌ **複雑性増加**: 追加テーブル管理が必要
- ❌ **パフォーマンス**: JOINクエリが増加

---

## 🚀 推奨実装手順

### **Phase 1: 現状保持 + 新方式準備**

1. **メールベースのユーザー特定関数**を作成
2. **Webhook処理の改善**（デュアル管理）
3. **新規Customer作成時の改善**

### **Phase 2: Supabase Auth移行**

1. **Prismaスキーマ変更** (`@default(uuid())`)
2. **既存データのUUID変換**
3. **Stripe Customer情報の更新**

### **Phase 3: 新方式への完全移行**

1. **Webhook処理の完全移行**
2. **旧方式のクリーンアップ**
3. **データ整合性の確認**

---

## 📝 具体的なコード例

### 改善されたWebhook処理

```typescript
async function getUserByStripeCustomer(
  customerId: string
): Promise<User | null> {
  // 1. Stripe Customerからメールアドレスを取得
  let customerEmail: string;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    customerEmail = (customer as any).email;

    if (!customerEmail) {
      console.error("No email found for Stripe customer:", customerId);
      return null;
    }
  } catch (error) {
    console.error("Failed to retrieve Stripe customer:", customerId, error);
    return null;
  }

  // 2. メールアドレスでユーザーを特定
  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!user) {
    console.error("User not found for email:", customerEmail);
    return null;
  }

  // 3. Stripe Customer IDを更新（必要に応じて）
  if (user.stripeCustomerId !== customerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
    console.log("Updated stripeCustomerId for user:", user.email);
  }

  return user;
}

// 使用例
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const user = await getUserByStripeCustomer(invoice.customer as string);

  if (!user) {
    console.error("User not found for invoice:", invoice.id);
    return;
  }

  console.log(`Payment succeeded for user: ${user.email}`);
  // 以降の処理...
}
```

### Customer作成の改善

```typescript
export async function createStripeCustomer(email: string, name?: string) {
  if (!stripe) throw new Error("Stripe not initialized");

  // 既存Customerの確認（メールベース）
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    console.log("Existing Stripe customer found:", email);
    return existingCustomers.data[0];
  }

  // 新規Customer作成
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      source: "learning-journal",
      userEmail: email,
      createdAt: new Date().toISOString(),
    },
  });

  console.log("New Stripe customer created:", email);
  return customer;
}
```

---

## 📊 移行時の注意点

### 1. **データバックアップ**

- 移行前に全ユーザーデータをバックアップ
- Stripe Customer情報のエクスポート

### 2. **段階的テスト**

- 開発環境での完全テスト
- 本番環境での段階的ロールアウト

### 3. **ダウンタイム最小化**

- Blue-Green デプロイメント
- リアルタイム移行スクリプト

### 4. **ロールバック計画**

- 移行失敗時の復旧手順
- データ整合性チェック

---

## 🎉 期待される効果

### **移行後のメリット**

- ✅ **Webとモバイルの認証統一**: Supabase Auth
- ✅ **Stripe統合の安定化**: メールベース管理
- ✅ **開発効率向上**: NextAuth削除でシンプル化
- ✅ **スケーラビリティ向上**: Supabase Auth の機能活用

### **長期的なメリット**

- ✅ **メンテナンス性向上**: 統一された認証システム
- ✅ **セキュリティ強化**: Supabase のセキュリティ機能
- ✅ **機能拡張性**: OAuth プロバイダーの追加が容易
