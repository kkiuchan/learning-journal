# デプロイメントガイド

このドキュメントでは、アプリケーションを本番環境にデプロイするための手順を説明します。

## 前提条件

- [Vercel](https://vercel.com/)のアカウント
- [Supabase](https://supabase.com/)のアカウント
- [GitHub](https://github.com/)のアカウント

## デプロイ手順

### 1. リポジトリのセットアップ

1. アプリケーションのリポジトリを GitHub に作成します。
2. ローカルのコードをリポジトリにプッシュします。

### 2. Vercel プロジェクトの作成

1. Vercel にログインし、「New Project」をクリックします。
2. GitHub リポジトリをインポートします。
3. プロジェクト設定を行います。

### 3. 環境変数の設定

以下の環境変数を Vercel プロジェクトの「Environment Variables」セクションで設定します。

#### 必須環境変数

| 変数名                          | 説明                     | 例                                              |
| ------------------------------- | ------------------------ | ----------------------------------------------- |
| `DATABASE_URL`                  | データベース接続 URL     | `postgresql://user:password@host:port/database` |
| `AUTH_SECRET`                   | 認証用のシークレットキー | 安全な乱数文字列                                |
| `NEXT_PUBLIC_APP_URL`           | アプリケーションの URL   | `https://your-app.vercel.app`                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase の URL          | `https://xxxxxxxxxxxx.supabase.co`              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の匿名キー      | `eyJhbGciOiJIUzI1...`                           |

#### OAuth プロバイダー（必要な場合）

| 変数名                  | 説明                                      |
| ----------------------- | ----------------------------------------- |
| `GOOGLE_CLIENT_ID`      | Google の OAuth クライアント ID           |
| `GOOGLE_CLIENT_SECRET`  | Google の OAuth クライアントシークレット  |
| `GITHUB_CLIENT_ID`      | GitHub の OAuth クライアント ID           |
| `GITHUB_CLIENT_SECRET`  | GitHub の OAuth クライアントシークレット  |
| `DISCORD_CLIENT_ID`     | Discord の OAuth クライアント ID          |
| `DISCORD_CLIENT_SECRET` | Discord の OAuth クライアントシークレット |

#### その他の設定（オプション）

| 変数名      | 説明                                   | デフォルト値 |
| ----------- | -------------------------------------- | ------------ |
| `LOG_LEVEL` | ログレベル（debug, info, warn, error） | `error`      |

### 4. データベースのセットアップ

1. Supabase でプロジェクトを作成します。
2. PostgreSQL データベースの接続情報を取得します。
3. データベース接続 URL を環境変数に設定します。
4. マイグレーションを実行します：
   ```
   npx prisma migrate deploy
   ```

### 5. ストレージのセットアップ（ファイルアップロード用）

1. Supabase の「Storage」セクションにアクセスします。
2. `files`という名前のバケットを作成します。
3. アクセス制御を設定します。

### 6. デプロイ

1. Vercel の「Deploy」ボタンをクリックします。
2. デプロイが完了するまで待ちます。
3. デプロイ後の URL を確認します。

## 環境変数の更新

環境変数を更新する場合は、Vercel のプロジェクト設定から「Environment Variables」セクションにアクセスし、値を更新してください。更新後、再デプロイが必要な場合があります。

## トラブルシューティング

### データベース接続エラー

データベース接続エラーが発生した場合は、以下を確認してください：

1. `DATABASE_URL`が正しく設定されているか
2. データベースサーバーがアクセス可能か
3. ファイアウォールやネットワーク制限がないか

### 認証エラー

認証に関するエラーが発生した場合は、以下を確認してください：

1. `AUTH_SECRET`が正しく設定されているか
2. OAuth プロバイダーのリダイレクト URL が正しく設定されているか

### ストレージエラー

ファイルアップロードに関するエラーが発生した場合は、以下を確認してください：

1. Supabase の設定が正しいか
2. `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しく設定されているか
3. ストレージバケットのアクセス権限が適切か

## 本番環境の監視

本番環境では、以下の監視を行うことをお勧めします：

1. Vercel のダッシュボードでのパフォーマンス監視
2. データベースの監視
3. ログの監視
4. エラーの監視（管理画面のエラーログセクションを使用）
