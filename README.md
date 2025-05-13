# Learning Journal

プログラミング学習の記録と振り返りをサポートするWebアプリケーション

## 概要

Learning Journalは、プログラミング学習者向けの学習記録プラットフォームです。日々の学習内容を記録し、振り返りを行うことで、効果的な学習をサポートします。また、AIによる学習アドバイスを提供し、より効率的な学習をサポートします。

### 主な機能

- 📝 学習ユニットの作成と管理

  - 学習目標の設定と進捗管理
  - 事前の理解度確認と学習計画
  - 学習後の振り返りと次のアクションの記録
  - ステータス管理（未着手、進行中、完了）
  - 公開/非公開設定
  - いいね機能とコメント機能

- ⏱ 学習ログの記録

  - 日付別の学習時間トラッキング
  - 学習内容の詳細なメモ機能
  - タグによる学習内容の分類
  - 画像アップロード機能
  - 学習の進捗状況の可視化
  - 総学習時間の自動計算

- 👥 ユーザー機能

  - メールアドレスによる認証（メール確認機能付き）
  - GitHub/Googleアカウントでのソーシャルログイン
  - プロフィールのカスタマイズ
    - プロフィール画像の設定
    - 自己紹介文の編集
  - スキルと興味分野の設定（タグ形式）

- 🔍 検索・発見機能

  - ユーザー検索（名前、スキル、興味分野）
  - タグベースの学習内容検索
  - 学習ユニットの検索と絞り込み

- 📊 分析・レポート機能

  - 月別・週別の学習時間集計
  - 目標達成率の表示
  - 学習の継続状況の可視化

- 🛠 その他の機能

  - レスポンシブデザイン対応
  - ダークモード対応

- 🤖 AIによる学習サポート
  - 学習ログの分析に基づく改善提案
  - 次の学習ステップのレコメンド

## 技術スタック

- **フロントエンド**

  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Shadcn UI
  - React Hook Form

- **バックエンド**

  - Next.js API Routes
  - Prisma (ORM)
  - PostgreSQL
  - NextAuth.js

- **AI**

  - OpenAI API (GPT-4)

- **インフラ**
  - Vercel (ホスティング)
  - Supabase (データベース)
  - Resend (メール送信)

## 開発環境のセットアップ

1. リポジトリのクローン

```bash
git clone https://github.com/kkiuchan/learning-journal.git
cd learning-journal
```

2. 依存関係のインストール

```bash
npm install
```

3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集し、必要な環境変数を設定してください。

4. データベースのセットアップ

```bash
npx prisma migrate dev
```

5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 環境変数

以下の環境変数が必要です：

```env
# 認証
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# データベース
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Discord認証
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# GitHub認証
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google認証
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# メール送信（Resend）
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@learning-journal-app.com"

# アプリケーション
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Vercel
VERCEL_BLOB_TOKEN="your-vercel-blob-token"
```

各環境変数は以下のカテゴリに分類されます：

1. アプリケーション設定

   - データベース
   - 認証設定
   - ソーシャルログイン
   - メール送信
   - ファイルアップロード
   - AI機能
   - セキュリティ

2. 外部サービス連携

   - OpenAI関連の設定


