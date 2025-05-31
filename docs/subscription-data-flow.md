# サブスクリプション データフロー仕様書

Learning Journalのサブスクリプションシステムにおけるデータ更新フローの詳細仕様

---

## 概要

本ドキュメントでは、Learning Journalのサブスクリプションシステムにおけるデータフローを詳細に説明します。主に以下の2つのライフサイクルに焦点を当てています：

1. **トライアル登録 → トライアル期間中のキャンセル**
2. **プロプラン移行 → 移行後のキャンセル**

---

## システム構成要素

### データベース（Prisma）

- `User`テーブルでサブスクリプション関連情報を管理
- 主要フィールド：
  - `subscriptionStatus`: 'trialing', 'active', 'canceled', 'past_due', 'deleted', 'lifetime'
  - `subscriptionPlan`: 'pro' or null
  - `subscriptionStart` / `subscriptionEnd`: 課金期間
  - `trialEnd`: トライアル期間終了日
  - `cancelAtPeriodEnd`: 期間終了時解約フラグ
  - `canceledAt`: 解約予約日時
  - `stripeCustomerId` / `stripeSubscriptionId`: Stripe連携ID

#### `subscriptionStart` と `subscriptionEnd` の意味

これらのフィールドは、ユーザーの現在の**有効期間**を表し、その意味はサブスクリプションの状態によって異なります：

**トライアル期間中（`subscriptionStatus: "trialing"`）：**

- `subscriptionStart`: **トライアル期間の開始日**（ユーザー登録日）
- `subscriptionEnd`: **トライアル期間の終了日**（登録から7日後）
- 例：登録日が2025-05-31の場合
  - `subscriptionStart`: 2025-05-31
  - `subscriptionEnd`: 2025-06-07（7日後）

**課金期間中（`subscriptionStatus: "active"`）：**

- `subscriptionStart`: **現在の課金期間の開始日**
- `subscriptionEnd`: **現在の課金期間の終了日**（通常は1ヶ月後）
- 例：トライアル終了後の課金開始時
  - `subscriptionStart`: 2025-06-07（課金開始日）
  - `subscriptionEnd`: 2025-07-07（次回課金日）

**期間移行のタイミング：**

- トライアル → 課金：トライアル終了時にwebhookで自動更新
- 月次更新：毎月の課金日にwebhookで期間更新

**重要な仕様：**

- 常に**現在の有効期間**を示す
- キャンセル予約時でも、期間終了まで有効な値を保持
- `isActive`の計算は`subscriptionEnd > 現在時刻`で判定

### Stripe

- 実際の決済・サブスクリプション管理
- Webhook経由でデータ同期

### Webhook処理

- Stripeイベントを受信してデータベース更新
- メール通知の送信

---

## フロー1: トライアル登録 → トライアル期間中のキャンセル

### 1-1. トライアル登録フロー

#### ①プライシングページでの登録開始

**トリガー**: ユーザーが「プロプランを始める」ボタンをクリック

**API処理**: `POST /api/stripe/create-checkout-session`

```typescript
// リクエスト
{ planId: "PRO" }

// Stripeチェックアウトセッション作成
subscription_data: {
  trial_period_days: 7, // 7日間無料トライアル
  metadata: { userId, planId: "PRO" }
}
```

**データベース変更**: なし（チェックアウト完了まで待機）

#### ②Stripeチェックアウト完了

**トリガー**: ユーザーがStripeでカード情報入力完了

**Webhook受信**: `checkout.session.completed`

```typescript
// Stripe状態
{
  subscription: {
    status: "trialing",
    trial_end: 1640995200, // Unix timestamp
    current_period_start: 1640390400,
    current_period_end: 1640995200,
    cancel_at_period_end: false
  }
}
```

**データベース更新**:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionStatus: "trialing", // トライアル状態
    subscriptionPlan: "pro", // プロプラン
    subscriptionStart: new Date(periodStart), // トライアル開始日
    subscriptionEnd: trialEnd, // トライアル終了日（重要：periodEndではない）
    trialEnd: trialEnd, // トライアル終了日
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    cancelAtPeriodEnd: false,
    canceledAt: null,
  },
});
```

**重要な実装ポイント：**

- **トライアル期間中は `subscriptionEnd = trialEnd`**
- Stripeの `current_period_end` は課金期間の終了日なので、トライアル中は使用しない
- これにより `isActive` 計算でトライアル期間が正しく判定される

**メール送信**: `sendTrialStartedWelcome()` - トライアル開始ウェルカムメール

**ユーザー状態**:

- プロプラン機能（AI機能等）利用可能
- `willCancelAtPeriodEnd: false`

### 1-2. トライアル期間中のキャンセル

#### ①ユーザーがキャンセル実行

**トリガー**: カスタマーポータルでサブスクリプションキャンセル

**Stripe処理**: サブスクリプションを`cancel_at_period_end = true`に設定

**Webhook受信**: `customer.subscription.updated`

```typescript
// Stripe状態
{
  subscription: {
    status: "trialing",                    // まだトライアル中
    trial_end: 1640995200,
    current_period_end: 1640995200,
    cancel_at_period_end: true,           // 期間終了時キャンセル予約
    canceled_at: 1640800000               // キャンセル実行日時
  }
}
```

**データベース更新**:

```typescript
const shouldDeactivate = cancel_at_period_end && periodEnd <= now;

await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionStatus: shouldDeactivate ? "canceled" : "trialing",
    subscriptionPlan: "pro", // トライアル期間中は維持
    subscriptionEnd: periodEnd,
    trialEnd: trialEnd,
    cancelAtPeriodEnd: true, // キャンセル予約フラグ
    canceledAt: new Date(canceled_at * 1000), // キャンセル実行日時
  },
});
```

**メール送信**: `sendSubscriptionCancelledNotification()` - キャンセル通知メール

**ユーザー状態**:

- トライアル期間終了まではプロプラン機能利用可能
- `willCancelAtPeriodEnd: true`
- UI上で「○月○日に無料プランに戻る予定」と表示

#### ②トライアル期間終了（自動処理）

**トリガー**: トライアル期間終了日時到達

**Webhook受信**: `customer.subscription.updated` or `customer.subscription.deleted`

```typescript
// Stripe状態
{
  subscription: {
    status: "canceled",  // または削除
    cancel_at_period_end: true,
    current_period_end: 1640995200  // 過去の日時
  }
}
```

**データベース更新**:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionStatus: "canceled", // キャンセル完了
    subscriptionPlan: null, // 無料プランに戻る
    subscriptionStart: null,
    subscriptionEnd: null,
    trialEnd: null,
    cancelAtPeriodEnd: false, // リセット
    canceledAt: null, // リセット
  },
});
```

**ユーザー状態**:

- 無料プラン機能のみ利用可能
- AI機能は利用不可

---

## 補足：トライアル期間終了 → 課金期間開始

トライアル期間が終了してキャンセルされていない場合、自動的に課金期間に移行します。

### 課金期間開始フロー

**トリガー**: トライアル期間終了日時到達

**Webhook受信**: `customer.subscription.updated`

```typescript
// Stripe状態
{
  subscription: {
    status: "active",                     // トライアル → アクティブに変更
    trial_end: null,                      // トライアル終了
    current_period_start: 1640995200,    // 課金期間開始
    current_period_end: 1643587200,      // 課金期間終了（1ヶ月後）
    cancel_at_period_end: false
  }
}
```

**データベース更新**:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionStatus: "active", // アクティブに変更
    subscriptionPlan: "pro", // 継続
    subscriptionStart: new Date(current_period_start), // 課金期間開始日
    subscriptionEnd: new Date(current_period_end), // 課金期間終了日（1ヶ月後）
    trialEnd: null, // トライアル終了
    cancelAtPeriodEnd: false,
    canceledAt: null,
  },
});
```

**重要な変更点：**

- `subscriptionStart`: トライアル開始日 → **課金期間開始日**に更新
- `subscriptionEnd`: トライアル終了日 → **課金期間終了日（1ヶ月後）**に更新
- `trialEnd`: クリア（null）
- Stripeの `current_period_start/end` を使用（トライアル中は未定義だった）

**ユーザー状態**:

- プロプラン機能継続利用可能
- 月額課金開始

---

## フロー2: プロプラン移行 → 移行後のキャンセル

### 2-1. トライアルからプロプランへの移行

#### ①トライアル期間終了前の決済

**トリガー**: トライアル期間終了、初回決済実行

**Webhook受信**: 複数のイベントが順次発生

1. `customer.subscription.trial_will_end` (3日前警告)
2. `invoice.payment_succeeded` (決済成功)
3. `customer.subscription.updated` (状態更新)

**決済成功時の処理**:

```typescript
// invoice.payment_succeeded
{
  invoice: {
    amount_paid: 680,  // 月額料金
    billing_reason: "subscription_cycle",
    customer: "cus_xxx"
  }
}
```

**サブスクリプション状態更新**:

```typescript
// customer.subscription.updated
{
  subscription: {
    status: "active",                      // アクティブに変更
    trial_end: null,                       // トライアル終了
    current_period_start: 1640995200,
    current_period_end: 1643587200,       // 次回更新日
    cancel_at_period_end: false
  }
}
```

**データベース更新**:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionStatus: "active", // アクティブプラン
    subscriptionPlan: "pro",
    subscriptionStart: new Date(periodStart),
    subscriptionEnd: new Date(periodEnd), // 次回更新日
    trialEnd: null, // トライアル終了
    cancelAtPeriodEnd: false,
    canceledAt: null,
  },
});
```

**メール送信**: `sendPaymentSucceededNotification()` - 決済成功通知

### 2-2. プロプラン期間中のキャンセル

#### ①ユーザーがキャンセル実行

**トリガー**: カスタマーポータルでサブスクリプションキャンセル

**Stripe処理**: サブスクリプションを`cancel_at_period_end = true`に設定

**Webhook受信**: `customer.subscription.updated`

```typescript
// Stripe状態
{
  subscription: {
    status: "active",                      // まだアクティブ
    current_period_start: 1640995200,
    current_period_end: 1643587200,       // 有効期限
    cancel_at_period_end: true,           // 期間終了時キャンセル予約
    canceled_at: 1641600000               // キャンセル実行日時
  }
}
```

**データベース更新**:

```typescript
const shouldDeactivate = cancel_at_period_end && periodEnd <= now;

await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionStatus: shouldDeactivate ? "canceled" : "active",
    subscriptionPlan: "pro", // 期間中は維持
    subscriptionEnd: periodEnd, // 有効期限まで
    cancelAtPeriodEnd: true, // キャンセル予約フラグ
    canceledAt: new Date(canceled_at * 1000), // キャンセル実行日時
  },
});
```

**メール送信**: `sendSubscriptionCancelledNotification()` - キャンセル通知メール

**ユーザー状態**:

- 現在の課金期間終了まではプロプラン機能利用可能
- `willCancelAtPeriodEnd: true`
- UI上で「○月○日に無料プランに戻る予定」と表示

#### ②課金期間終了（自動処理）

**トリガー**: 課金期間終了日時到達

**Webhook受信**: `customer.subscription.updated` or `customer.subscription.deleted`

```typescript
// Stripe状態
{
  subscription: {
    status: "canceled",  // または削除
    cancel_at_period_end: true,
    current_period_end: 1643587200  // 過去の日時
  }
}
```

**データベース更新**:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionStatus: "canceled", // キャンセル完了
    subscriptionPlan: null, // 無料プランに戻る
    subscriptionStart: null,
    subscriptionEnd: null,
    trialEnd: null,
    cancelAtPeriodEnd: false, // リセット
    canceledAt: null, // リセット
  },
});
```

**メール送信**: 最終キャンセル通知メール（必要に応じて）

**ユーザー状態**:

- 無料プラン機能のみ利用可能
- AI機能は利用不可

---

## エラーハンドリング・復旧フロー

### Webhook処理失敗時の対応

#### 手動同期API

**エンドポイント**: `POST /api/sync-subscription`

**処理内容**:

1. Stripeから最新のサブスクリプション状態を取得
2. データベースと比較して差分を検出
3. データベースを最新状態に更新

**使用ケース**:

- Webhook処理失敗時の復旧
- データ不整合の修正
- 管理者による手動同期

#### デバッグAPI

**エンドポイント**: `GET /api/debug-subscription`

**応答内容**:

```typescript
{
  user: {
    // データベース上の状態
    subscriptionStatus: "trialing",
    cancelAtPeriodEnd: false,
    // ...
  },
  stripe: {
    // Stripe上の状態
    status: "active",
    cancel_at_period_end: true,
    // ...
  },
  comparison: {
    // 差分検出結果
    // ...
  }
}
```

### 日付変換エラーの対策

**問題**: Stripeの`current_period_start`が無効値の場合

**解決策**:

```typescript
const periodStart = sub.current_period_start
  ? new Date(sub.current_period_start * 1000)
  : null;

const periodEnd = sub.current_period_end
  ? new Date(sub.current_period_end * 1000)
  : null;
```

---

## UI状態とデータの対応

### プライシングページ表示ロジック

```typescript
function getSubscriptionDisplayInfo(subscriptionInfo) {
  const {
    currentPlan,
    isActive,
    subscriptionStatus,
    cancelAtPeriodEnd,
    subscriptionEnd,
    willCancelAtPeriodEnd,
  } = subscriptionInfo;

  // キャンセル予約中
  if (willCancelAtPeriodEnd) {
    return {
      status: "will_cancel",
      message: `${formatDate(subscriptionEnd)}に無料プランに戻る予定`,
      showManage: true,
      showSubscribe: false,
    };
  }

  // アクティブプラン
  if (isActive && currentPlan === "PRO") {
    return {
      status: "active",
      message:
        subscriptionStatus === "trialing"
          ? `トライアル期間中（${formatDate(subscriptionEnd)}まで）`
          : `次回更新: ${formatDate(subscriptionEnd)}`,
      showManage: true,
      showSubscribe: false,
    };
  }

  // 無料プラン
  return {
    status: "free",
    message: "無料プラン",
    showManage: false,
    showSubscribe: true,
  };
}
```

### AI機能利用可否の判定

```typescript
function canUseAIFeatures(user) {
  const { subscriptionStatus, subscriptionEnd, trialEnd } = user;

  // ライフタイムプラン
  if (subscriptionStatus === "lifetime") return true;

  // アクティブプラン
  if (
    subscriptionStatus === "active" &&
    subscriptionEnd &&
    new Date(subscriptionEnd) > new Date()
  ) {
    return true;
  }

  // トライアル期間中
  if (subscriptionStatus === "trialing") {
    const endDate = trialEnd || subscriptionEnd;
    return endDate && new Date(endDate) > new Date();
  }

  return false;
}
```

---

## 監視・ログ

### 重要なログポイント

1. **Webhook受信時**

   ```typescript
   console.log("🔔 Webhook received:", event.type, subscription.id);
   ```

2. **データベース更新前**

   ```typescript
   console.log("🗃️ Database update data:", updateData);
   ```

3. **メール送信時**
   ```typescript
   console.log("📧 Sending notification:", emailType, userEmail);
   ```

### 異常検知すべき状況

- Webhook処理時間の異常延長
- 同一ユーザーへの重複webhook
- データベース更新失敗
- メール送信失敗
- Stripe APIエラー

---

## セキュリティ考慮事項

### Webhook認証

- Stripe署名の検証必須
- IPホワイトリスト検討
- リクエスト頻度制限

### データアクセス制限

- ユーザー自身のサブスクリプション情報のみアクセス可能
- 管理者権限の適切な制御
- APIキーの安全な管理

---

## 今後の拡張予定

### 追加予定機能

- 年間プランの追加
- プラン変更（プロ→プレミアム等）
- 複数プロダクトのサブスクリプション
- 企業向けプラン

### 改善予定

- リアルタイム同期の強化
- エラー復旧の自動化
- 詳細な利用統計レポート

---

## 問題と修正履歴

### ❌ trialEndフィールドの古い値残存問題

#### 🔍 **問題の概要**

- 一度トライアルを経験したユーザーの`trialEnd`フィールドに古い日付が残存
- サブスクリプション削除時に`trialEnd`がクリアされていない
- 新規サブスクリプション作成時に古い`trialEnd`が残る

#### 🚨 **発生パターン**

1. トライアル開始 → キャンセル → プロプラン再登録
2. トライアル期間完了 → 一時停止 → プロプラン再登録

#### 💡 **修正内容（2024年1月実装）**

**1. subscription.deleted時の完全クリア**

```typescript
await prisma.user.update({
  where: { id: user.id },
  data: {
    subscriptionStatus: "deleted",
    subscriptionPlan: null,
    subscriptionStart: null,
    subscriptionEnd: null,
    trialEnd: null, // ← 追加：trialEndもクリア
    cancelAtPeriodEnd: false, // ← 追加：キャンセルフラグもリセット
    canceledAt: null, // ← 追加：キャンセル日時もクリア
    stripeSubscriptionId: null,
    stripePriceId: null,
  },
});
```

**2. checkout.session.completed時の明確な初期化**

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    // ...他のフィールド
    trialEnd: trialEnd, // Stripeの値を正確に反映（なければnull）
    cancelAtPeriodEnd: false, // 新規なのでfalse
    canceledAt: null, // 新規なのでnull
  },
});
```

#### ✅ **修正後の動作**

- サブスクリプション削除時に全フィールドが適切にクリア
- 新規サブスクリプション作成時にStripeの値を正確に反映
- トライアルなしの有料プランでは`trialEnd: null`

### ❌ トライアル重複利用問題

#### 🔍 **問題の概要**

- トライアル期間中にキャンセル後、再登録時も7日間トライアルが適用される
- Stripeの仕様上、同じ顧客へのトライアルは一度きりのはずが、システムで制御されていない
- 結果：再登録時にトライアルなしで即課金開始される

#### 🚨 **発生パターン**

1. 初回トライアル開始 → キャンセル → 再登録
2. ユーザーは7日間トライアルを期待 → 実際は即課金開始

#### 💡 **修正内容（2024年1月実装）**

**1. チェックアウトセッション作成時のトライアル履歴チェック**

```typescript
// ユーザーのトライアル利用履歴をチェック
const hasUsedTrial = user.trialEnd !== null;

// チェックアウトセッションを作成
const checkoutSession = await createCheckoutSession({
  customerId,
  priceId: plan.stripePriceId,
  // ...other params
  trialEligible: !hasUsedTrial, // トライアル未利用の場合のみtrue
});
```

**2. createCheckoutSession関数の修正**

```typescript
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
  trialEligible = true, // 新しいパラメータ
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trialEligible?: boolean; // オプショナル
}) {
  // トライアル適用の判定
  const subscriptionData: any = { metadata };

  if (trialEligible) {
    subscriptionData.trial_period_days = 7; // トライアル適用
    console.log("✅ Trial applied: 7 days free trial");
  } else {
    console.log("❌ Trial not applied: User has already used trial");
  }

  // Stripeセッション作成
  const session = await stripe.checkout.sessions.create({
    // ...
    subscription_data: subscriptionData,
  });
}
```

**3. UI表示の改善**

```typescript
// ボタンテキストの動的変更
const hasUsedTrial = subscriptionInfo?.trialEnd !== null;
const buttonText = hasUsedTrial
  ? "プロプランを始める（即開始）"
  : "7日間無料でお試し";

// 説明文の動的変更
{
  subscriptionInfo?.trialEnd !== null
    ? "※ トライアルは一度きりのため、即座に課金が開始されます"
    : "最初の7日間は無料でお試しいただけます";
}
```

#### ✅ **修正後の動作**

- **初回登録**: 7日間無料トライアル適用
- **再登録時**: トライアルなしで即課金開始
- **UI表示**: ユーザーに事前に課金タイミングを明示
- **透明性**: 「即開始」「トライアルは一度きり」の明確な表示

---

このドキュメントは、サブスクリプションシステムの仕様変更に合わせて定期的に更新される必要があります。
