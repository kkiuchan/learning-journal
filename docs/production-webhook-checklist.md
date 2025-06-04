# 本番環境Webhook設定チェックリスト

## 🎯 **本番デプロイ前の確認事項**

### **1. Stripe Dashboard設定**

#### **Webhookエンドポイント設定**

```
URL: https://your-domain.com/api/stripe/webhook
イベント: 以下を選択
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- invoice.upcoming
- customer.subscription.trial_will_end
```

#### **環境の切り替え**

- **開発環境**: テストモード（Test data）
- **本番環境**: 本番モード（Live data）

### **2. 環境変数設定**

#### **本番環境用**

```bash
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx  # 本番用Price ID
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### **3. デプロイ後のテスト手順**

#### **Step 1: Webhook受信テスト**

```bash
# 本番環境でのWebhook状況確認
curl https://your-domain.com/api/stripe/webhook-test
```

#### **Step 2: 実際の決済テスト**

1. 本番環境で実際のクレジットカードでテスト
2. Webhookが自動受信されるか確認
3. データベース更新を確認

#### **Step 3: エラーモニタリング**

- StripeダッシュボードのWebhookログ確認
- アプリケーションログ確認
- エラー通知設定

## 🚨 **よくある本番環境の問題**

### **問題1: Webhook Secret不一致**

- **症状**: `Webhook signature verification failed`
- **解決**: 本番用のWebhook Secretを正しく設定

### **問題2: CORS/SSL証明書問題**

- **症状**: Webhookが受信されない
- **解決**: HTTPS設定の確認、SSL証明書の有効性確認

### **問題3: 環境変数の設定漏れ**

- **症状**: Stripe初期化エラー
- **解決**: 本番用環境変数の再確認

## 📊 **本番環境監視項目**

### **リアルタイム監視**

- Webhook処理成功率
- データベース更新状況
- エラー発生率

### **定期確認**

- Stripeダッシュボードのイベントログ
- ユーザーのサブスクリプション状況
- 課金処理の正確性

## 🔄 **緊急時の対応**

### **Webhook処理失敗時**

1. Stripeダッシュボードで失敗イベントを確認
2. 手動Webhook処理APIを使用
3. データベースの整合性確認

### **データ不整合時**

1. Stripeとデータベースの照合
2. 手動での修正処理
3. ユーザーへの通知

---

**📝 注意**: 本番環境では実際の課金が発生するため、十分なテストを行ってからデプロイしてください。
