# メール送信ロジックの最適化案

## 🔍 現在の問題

### 問題1: メール送信システムの混在

- **Supabase Auth**: ユーザー登録・パスワードリセット
- **Resend API**: 確認メール再送信・独自機能

### 問題2: リダイレクト先の不整合

- **Supabase確認メール**: `/auth/callback`
- **Resend確認メール**: `/auth/verify`

### 問題3: テンプレートの重複管理

- Supabaseダッシュボードのテンプレート
- ResendのHTMLテンプレート

## 💡 推奨解決策

### Option A: Supabase Auth統一（推奨）

#### メリット

- 設定が簡単
- 一元管理
- セキュリティが強化
- メンテナンスが楽

#### 実装

```typescript
// src/lib/supabase-auth.ts の修正
export async function signUpWithPassword(
  email: string,
  password: string,
  userData?: { name?: string }
) {
  const client = getSupabaseClient();
  return await client.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// 確認メール再送信もSupabase Auth使用
export async function resendConfirmationEmail(email: string) {
  const client = getSupabaseClient();
  return await client.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
```

#### Supabase Dashboard設定

1. **Authentication** → **Email Templates**
2. **Confirm signup** テンプレートを日本語にカスタマイズ:

```html
<h2>学習ジャーナルへようこそ！</h2>
<p>メールアドレスの確認をお願いします。</p>
<p>以下のボタンをクリックしてアカウントを有効化してください：</p>
<a
  href="{{ .ConfirmationURL }}"
  style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px;"
>
  アカウントを有効化
</a>
<p>このリンクは24時間有効です。</p>
```

### Option B: 完全Resend統一

#### メリット

- より柔軟なカスタマイズ
- 高度な分析機能
- 独自ドメインからの送信

#### デメリット

- より複雑な実装
- セキュリティの自己管理
- メンテナンス負荷増

## 🚀 実装手順（Option A推奨）

### Step 1: Supabase Dashboard設定

1. **Email Templates** で日本語テンプレート設定
2. **Redirect URLs** に `/auth/callback` 追加
3. **Email confirmation** を有効化

### Step 2: コード修正

1. `signUpWithPassword` 関数修正
2. 確認メール再送信をSupabase Auth API使用
3. `/api/auth/verify-email` の削除または統合

### Step 3: 既存Resend機能の整理

1. 確認メール以外（お問い合わせなど）はResend継続
2. 認証関連メールはSupabase Auth統一

## 🔧 設定が必要な環境変数

### Supabase統一の場合

```bash
# 既存設定で十分
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Resend統一の場合

```bash
# 追加設定が必要
RESEND_API_KEY=re_your_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## ⚡ 即座の改善案

最小限の変更で現在の問題を解決：

```typescript
// src/app/api/auth/verify-email/route.ts
// リダイレクト先を統一
const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token=${token}&type=email`;
```

## 📊 推奨度比較

| 項目           | Supabase統一 | Resend統一 | 現状維持 |
| -------------- | ------------ | ---------- | -------- |
| 実装難易度     | ⭐⭐         | ⭐⭐⭐⭐   | ⭐       |
| メンテナンス性 | ⭐⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐     |
| セキュリティ   | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐   |
| カスタマイズ性 | ⭐⭐⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐     |
| 総合推奨度     | ⭐⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐     |

**結論**: **Supabase Auth統一**が最も実用的で保守性が高い選択肢です。
