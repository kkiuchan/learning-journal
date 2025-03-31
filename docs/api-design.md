# API 設計書

## 1. 概要

このドキュメントでは、アプリケーションの API 設計について説明します。

## 2. 設計方針

- RESTful API の原則に従う
- エンドポイントは名詞を使用（動詞は避ける）
- バージョニングを含める（例：/api/v1/...）
- 適切な HTTP メソッドを使用
- 一貫性のあるレスポンス形式

## 3. 共通仕様

### 3.1 ベース URL

```
/api/v1
```

### 3.2 認証

- NextAuth.js を使用
- セッションベースの認証
- 外部認証プロバイダー（Google, GitHub, Discord）のサポート

### 3.3 レスポンス形式

```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "error": null
}
```

### 3.4 エラーレスポンス

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {} // オプション：詳細情報
  }
}
```

## 4. エンドポイント一覧

### 4.1 認証関連

#### パスワード認証の確認

- **エンドポイント**: `/api/auth/check-password`
- **メソッド**: GET
- **説明**: ユーザーのパスワード認証の有無を確認
- **認証**: 必須
- **レスポンス**:

```json
{
  "success": true,
  "data": {
    "hasPassword": boolean
  }
}
```

#### アカウント連携

- **エンドポイント**: `/api/auth/link-account`
- **メソッド**: POST
- **説明**: パスワード認証の追加または更新
- **認証**: 必須
- **リクエスト**:

```json
{
  "email": "string",
  "currentPassword": "string", // パスワード変更時のみ必須
  "newPassword": "string",
  "confirmPassword": "string"
}
```

- **レスポンス**:

```json
{
  "success": true,
  "data": {
    "message": "パスワードを更新しました"
  }
}
```

#### パスワード設定

- **エンドポイント**: `/api/auth/set-password`
- **メソッド**: POST
- **説明**: 新規ユーザーのパスワード設定
- **認証**: 必須
- **リクエスト**:

```json
{
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

- **レスポンス**:

```json
{
  "success": true,
  "data": {
    "message": "パスワードを設定しました"
  }
}
```

#### アカウント連携解除

- **エンドポイント**: `/api/auth/unlink-account`
- **メソッド**: POST
- **説明**: 外部認証アカウントの連携解除
- **認証**: 必須
- **リクエスト**:

```json
{
  "provider": "string" // "google", "github", "discord"のいずれか
}
```

- **レスポンス**:

```json
{
  "success": true,
  "data": {
    "message": "アカウントの連携を解除しました"
  }
}
```

### 4.2 ユーザー関連

#### ユーザー情報取得

- **エンドポイント**: `/api/users/me`
- **メソッド**: GET
- **説明**: ログインユーザーの情報を取得
- **認証**: 必須
- **レスポンス**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string",
    "primaryAuthMethod": "string",
    "accounts": [
      {
        "provider": "string",
        "providerAccountId": "string"
      }
    ]
  }
}
```

## 5. ステータスコード

- 200: 成功
- 201: 作成成功
- 400: バッドリクエスト
- 401: 認証エラー
- 403: 権限エラー
- 404: リソース未検出
- 500: サーバーエラー

## 6. セキュリティ考慮事項

- HTTPS の使用
- レート制限の実装
- 入力値のバリデーション
- XSS 対策
- CSRF 対策
- パスワードのハッシュ化
- セッション管理
- 外部認証プロバイダーの安全な統合

## 7. 今後の拡張性

- ページネーション対応
- フィルタリング機能
- ソート機能
- 検索機能
- 追加の外部認証プロバイダー
- 2 要素認証のサポート
