# Stripe 本番環境移行 準備状況レポート

## 📊 現在の状況（2025年1月31日時点）

### ✅ 完了済み項目

1. **コードベース準備**

   - [x] サブスクリプションシステム実装完了
   - [x] Webhook処理の完全実装
   - [x] エラーハンドリング機構
   - [x] 環境判定ロジック追加
   - [x] 本番環境用ログレベル調整

2. **データフロー仕様**

   - [x] 詳細な仕様書作成（`docs/subscription-data-flow.md`）
   - [x] ステータス別リファレンス（`docs/subscription-status-reference.md`）
   - [x] トライアル重複利用問題の解決
   - [x] キャンセル処理の完全実装

3. **テスト・デバッグ機能**

   - [x] 環境設定チェックAPI（`/api/stripe/environment-check`）
   - [x] 管理画面（`/admin/stripe-environment`）
   - [x] CLIチェックスクリプト（`scripts/check-stripe-config.js`）
   - [x] 手動同期API（`/api/sync-subscription`）

4. **ドキュメント整備**
   - [x] 移行ガイド作成（`docs/stripe-production-migration.md`）
   - [x] npm スクリプト追加（`npm run stripe:check`）

### ❌ 未完了項目

1. **環境変数設定**

   - [ ] `STRIPE_PUBLISHABLE_KEY` の設定（テスト環境でも必要）
   - [ ] 本番用Stripe環境の準備

2. **Stripe本番環境設定**

   - [ ] 本番環境の有効化
   - [ ] 商品・価格の作成
   - [ ] Webhookエンドポイント設定
   - [ ] 本番用APIキー取得

3. **デプロイ環境設定**
   - [ ] Vercel本番環境変数設定
   - [ ] 本番ドメインでのWebhook設定

---

## 🚀 移行実行手順

### ステップ1: テスト環境の完全準備

1. **不足している環境変数を設定**

   ```bash
   # .env.local に追加
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx  # Stripeダッシュボードから取得
   ```

2. **設定確認**
   ```bash
   npm run stripe:check  # CLIでチェック
   npm run stripe:env    # APIでチェック
   ```

### ステップ2: Stripe本番環境準備

1. **Stripeダッシュボードでの作業**

   - [ ] 本番環境に切り替え
   - [ ] 商品作成: "Learning Journal プロプラン"
   - [ ] 価格設定: ¥680/月
   - [ ] Price ID取得: `price_xxxxx`

2. **Webhook設定**

   - [ ] エンドポイント: `https://your-domain.com/api/stripe/webhook`
   - [ ] 聴取イベント: 7種類設定（詳細は移行ガイド参照）
   - [ ] 署名シークレット取得: `whsec_xxxxx`

3. **APIキー取得**
   - [ ] 本番用シークレットキー: `sk_live_[シークレットキー]`
   - [ ] 本番用公開キー: `pk_live_[公開キー]`

### ステップ3: 本番環境変数設定

1. **Vercelダッシュボードで設定**

   ```
   STRIPE_SECRET_KEY=sk_live_[シークレットキー]
   STRIPE_PUBLISHABLE_KEY=pk_live_[公開キー]
   STRIPE_WEBHOOK_SECRET=whsec_[Webhookシークレット]
   STRIPE_PRO_PRICE_ID=price_[Price ID]
   ```

2. **その他の環境変数も確認**
   - DATABASE_URL（本番用）
   - NEXTAUTH_SECRET（本番用）
   - NEXTAUTH_URL（本番ドメイン）

### ステップ4: デプロイ・テスト

1. **本番環境デプロイ**

   ```bash
   git push origin main  # Vercel自動デプロイ
   ```

2. **動作確認**
   - [ ] 環境チェックページ確認: `/admin/stripe-environment`
   - [ ] テスト決済実行
   - [ ] Webhook配信確認
   - [ ] キャンセルフロー確認

---

## ⚠️ 重要な注意事項

### データ移行について

- **既存ユーザーのテストサブスクリプションは引き継がれません**
- 既存ユーザーには事前通知が必要
- 移行後は再登録が必要

### ロールバック準備

- 問題発生時にテスト環境に戻すため、テスト用環境変数を保持
- Vercelで環境変数の迅速な切り替えが可能

### 監視体制

- Stripeダッシュボードでのリアルタイム監視
- Webhook配信状況の定期確認
- エラー発生時の通知システム（要実装）

---

## 📈 本番運用後の計画

### 即座に実施すべきこと

1. **決済フローの詳細テスト**

   - 新規登録からキャンセルまでの全フロー確認
   - 各種エラーケースの確認

2. **監視システムの強化**
   - Webhook失敗時の自動復旧機能
   - 管理者への通知システム実装

### 中長期的な改善

1. **機能拡張**

   - 年間プランの追加
   - プラン変更機能
   - 割引クーポン機能

2. **運用効率化**
   - 自動レポート生成
   - カスタマーサポート機能強化

---

## ✅ 移行前チェックリスト

### 準備完了確認

- [ ] Stripe本番環境設定完了
- [ ] 環境変数すべて設定済み
- [ ] テスト決済で動作確認済み
- [ ] Webhook動作確認済み
- [ ] 既存ユーザーへの通知済み

### 移行実行日の作業

- [ ] 環境変数の本番用切り替え
- [ ] デプロイ実行
- [ ] 動作確認テスト
- [ ] 監視開始
- [ ] ユーザーへの運用開始通知

### 移行後の確認項目

- [ ] 新規登録フローの確認
- [ ] 決済処理の確認
- [ ] メール通知の確認
- [ ] キャンセル処理の確認
- [ ] エラーログの確認

---

**現在の準備完了度: 約85%**

残りの作業は主にStripe本番環境の設定と環境変数の更新です。コードベースとドキュメントは移行準備が完了しています。
