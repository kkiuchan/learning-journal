# Stripe 本番環境移行ガイド

## 1. Stripe ダッシュボードでの事前準備

### 1-1. 本番環境の有効化

1. [Stripe ダッシュボード](https://dashboard.stripe.com/)にログイン
2. 左上の「テストデータを表示」をクリックして本番環境に切り替え
3. アカウント設定で本番環境を有効化

### 1-2. 商品・価格の作成

1. **商品** → **すべての商品** → **商品を作成**
2. 商品設定:

   - 商品名: `Learning Journal プロプラン`
   - 説明: `AI機能を含むフル機能プラン`
   - 商品画像: 必要に応じて設定

3. **価格を追加**:
   - 価格モデル: `標準価格`
   - 価格: `¥680`
   - 請求期間: `月次`
   - Price ID をメモ（例: `price_1xxxxxxx`）

### 1-3. Webhook エンドポイントの設定

1. **開発者** → **Webhook** → **エンドポイントを追加**
2. エンドポイント URL: `https://your-domain.com/api/stripe/webhook`
3. 聴取するイベント:

   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`
   - `customer.subscription.trial_will_end`

4. **署名シークレット** をメモ（例: `whsec_xxxxxxx`）

### 1-4. API キーの取得

1. **開発者** → **API キー**
2. **本番環境用のキー** をメモ:
   - 公開可能キー（例: `pk_live_[公開キー]`）
   - シークレットキー（例: `sk_live_[シークレットキー]`）

## 2. 環境変数の更新

### 2-1. 本番環境用の環境変数設定

現在のテスト環境の変数を本番環境用に更新：

```bash
# Stripe本番環境設定
STRIPE_SECRET_KEY=sk_live_[本番用シークレットキー]
STRIPE_PUBLISHABLE_KEY=pk_live_[本番用公開キー]
STRIPE_WEBHOOK_SECRET=whsec_[Webhookシークレット]
STRIPE_PRO_PRICE_ID=price_[プロプランPrice ID]

# その他の環境変数も確認
DATABASE_URL=postgresql://[本番用データベースURL]
NEXTAUTH_SECRET=[本番用認証シークレット]
NEXTAUTH_URL=https://your-domain.com
```

### 2-2. Vercel環境変数設定（本番デプロイ時）

Vercelダッシュボードで環境変数を設定：

1. プロジェクト設定 → Environment Variables
2. 上記の変数をすべて `Production` 環境に設定

## 3. コード変更が必要な箇所

### 3-1. 環境判定の追加（推奨）

開発環境と本番環境を区別するため：

```typescript
// src/lib/stripe.ts に追加
export const isProduction = process.env.NODE_ENV === "production";
export const stripeEnvironment = isProduction ? "live" : "test";

// ログ出力で環境確認
console.log(`🔧 Stripe Environment: ${stripeEnvironment}`);
```

### 3-2. Webhook 処理の強化

本番環境では更なるセキュリティ対策を推奨：

```typescript
// src/app/api/stripe/webhook/route.ts
export async function POST(req: NextRequest) {
  // IP制限（必要に応じて）
  const clientIP =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

  // 本番環境でのログレベル調整
  if (process.env.NODE_ENV === "production") {
    // 本番環境では詳細ログを控えめに
    console.log("🔔 Webhook received:", event.type);
  } else {
    // テスト環境では詳細ログ
    console.log("🔔 Webhook received!", {
      /* ... */
    });
  }

  // ... 既存の処理
}
```

## 4. テスト手順

### 4-1. 本番環境移行前のテスト

1. **ローカル環境での確認**:

   ```bash
   # 本番用環境変数でローカルテスト
   npm run dev
   ```

2. **Stripe CLI でのテスト**:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

### 4-2. 本番環境でのテスト

1. **小額テスト**:

   - テストユーザーで実際の決済フローを確認
   - Webhook の動作確認
   - メール通知の確認

2. **キャンセルフローテスト**:
   - サブスクリプションキャンセルの動作確認
   - Customer Portal の動作確認

## 5. 監視・ログ設定

### 5-1. Stripe ダッシュボードでの監視

1. **イベント** → webhook の配信状況を監視
2. **ログ** → API リクエストの成功/失敗を監視
3. **サブスクリプション** → ユーザーの状況を監視

### 5-2. アプリケーションログの強化

```typescript
// エラー通知の追加（推奨）
export async function handleWebhookError(error: Error, eventType: string) {
  // 本番環境では管理者に通知
  if (process.env.NODE_ENV === "production") {
    // Slack, Discord, メール等で通知
    await notifyAdmin(`Webhook Error: ${eventType}`, error.message);
  }

  console.error(`❌ ${eventType} handler error:`, error);
}
```

## 6. 既存ユーザーへの影響

### 6-1. データ移行について

⚠️ **注意**: 本番環境移行時、既存のテストデータは引き継がれません。

**影響範囲**:

- テスト環境で作成されたサブスクリプション
- テスト環境のStripe Customer ID
- テスト決済履歴

**対応策**:

1. 既存ユーザーには移行前に通知
2. 移行後の再登録を案内
3. 必要に応じて特別なプランを提供

### 6-2. 移行通知文例

```
【重要】Learning Journal プロプラン本格運用開始のお知らせ

いつもLearning Journalをご利用いただき、ありがとうございます。

○月○日より、プロプランの本格運用を開始いたします。
これまでのテスト環境でのサブスクリプションは、
本格運用開始に伴いリセットされます。

引き続きプロプランをご利用希望の方は、
改めてご登録をお願いいたします。

...
```

## 7. 緊急時の対応

### 7-1. ロールバック手順

問題発生時にテスト環境に戻す手順：

1. 環境変数をテスト用に変更
2. Vercelで再デプロイ
3. ユーザーに状況を通知

### 7-2. 問題対応フロー

1. **Stripe ダッシュボードで状況確認**
2. **アプリケーションログの確認**
3. **Webhook配信状況の確認**
4. **必要に応じて手動同期実行**

## 8. 本番運用後の維持

### 8-1. 定期確認項目

- [ ] Webhook配信成功率（95%以上を維持）
- [ ] 決済成功率の確認
- [ ] サブスクリプション状態の整合性
- [ ] メール通知の配信状況

### 8-2. 月次レポート

- 新規登録数
- 解約数
- 売上データ
- エラー発生状況

---

## 🚀 移行実行時のチェックリスト

### 移行前

- [ ] Stripe本番環境の準備完了
- [ ] Price ID等の本番用データ取得
- [ ] Webhook エンドポイント設定完了
- [ ] 環境変数の本番用更新準備
- [ ] 既存ユーザーへの事前通知

### 移行時

- [ ] 環境変数の更新
- [ ] 本番環境へのデプロイ
- [ ] Webhook動作確認
- [ ] 決済フローのテスト
- [ ] キャンセルフローのテスト

### 移行後

- [ ] 監視システムの確認
- [ ] ユーザーへの移行完了通知
- [ ] 問題発生時の対応準備
- [ ] ドキュメントの更新

---

**移行作業は慎重に行い、問題が発生した場合は即座にテスト環境に戻せるよう準備しておくことが重要です。**
