# Supabase Auth移行 - セットアップガイド

## 🔧 必要な設定

### **1. Supabase環境変数の設定**

`.env`ファイルに以下を追加してください：

```bash
# 既存の設定（確認済み）
NEXT_PUBLIC_SUPABASE_URL="https://mqyoxoyzzrasoakldhoj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xeW94b3l6enJhc29ha2xkaG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDg5NTksImV4cCI6MjA1ODUyNDk1OX0.fiABGJB7jCUjq3dO2Aq-Bfa1wYusgKkGisuLq-Bwwjk"

# 追加が必要
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

### **2. Supabase Dashboardでの設定**

#### **2.1 OAuth プロバイダーの有効化**

**Google OAuth設定**:

1. Supabase Dashboard → Authentication → Providers
2. Google を有効化
3. Client ID と Client Secret を設定
4. Redirect URL: `https://mqyoxoyzzrasoakldhoj.supabase.co/auth/v1/callback`

**GitHub OAuth設定**:

1. GitHub → Settings → Developer settings → OAuth Apps
2. New OAuth App 作成
3. Authorization callback URL: `https://mqyoxoyzzrasoakldhoj.supabase.co/auth/v1/callback`
4. Client ID と Client Secret をSupabaseに設定

**Discord OAuth設定**:

1. Discord Developer Portal → Applications
2. OAuth2 → Redirects に追加: `https://mqyoxoyzzrasoakldhoj.supabase.co/auth/v1/callback`
3. Client ID と Client Secret をSupabaseに設定

#### **2.2 RLS (Row Level Security) 設定**

```sql
-- Userテーブルの基本ポリシー
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON "User"
FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON "User"
FOR UPDATE USING (auth.uid()::text = id);

-- 新規ユーザー作成は全て許可（移行時）
CREATE POLICY "Allow user creation" ON "User"
FOR INSERT WITH CHECK (true);
```

### **3. 移行テスト手順**

#### **3.1 既存ユーザー確認**

```bash
curl -X GET http://localhost:3000/api/auth/migrate-to-supabase
```

#### **3.2 テスト用ユーザー削除（開発環境のみ）**

```bash
curl -X DELETE http://localhost:3000/api/auth/migrate-to-supabase
```

#### **3.3 Supabase認証テスト**

1. `/auth/supabase-login` にアクセス
2. OAuth認証を実行
3. `/auth/callback` で自動ユーザー作成確認

### **4. 実装済みファイル**

- ✅ `src/app/api/auth/migrate-to-supabase/route.ts` - 移行API
- ✅ `src/app/auth/callback/page.tsx` - 認証コールバック
- ✅ `src/app/auth/supabase-login/page.tsx` - Supabaseログイン
- ✅ `src/lib/supabase-auth.ts` - Supabase Auth ユーティリティ

### **5. 次のステップ**

1. **Service Role Key追加** → .envファイル更新
2. **OAuth プロバイダー設定** → Supabase Dashboard
3. **RLS設定** → SQL実行
4. **移行テスト** → API確認
5. **本番反映** → 既存NextAuth削除

---

**移行準備が完了したら、実際のテストを開始できます！**
