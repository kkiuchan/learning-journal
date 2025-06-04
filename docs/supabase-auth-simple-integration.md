# Supabase Auth統合（シンプル版）

## 🎯 基本方針

**既存データを維持しながら、新規ユーザーのみSupabase Authを使用**

- ✅ 既存ユーザー：cuid ID + NextAuth（当面維持）
- ✅ 新規ユーザー：Supabase auth.users.id + Supabase Auth
- ✅ User.idは既存のままで変更なし
- ✅ 段階的移行が可能

## 📝 実装計画

### **Step 1: 並行稼働の準備**

#### 1.1 Prismaスキーマ（変更なし）

```prisma
model User {
  id String @id  // 既存：cuid、新規：Supabase UUID
  name String?
  email String @unique
  primaryAuthMethod String  // 'nextauth' or 'supabase'
  // 他のフィールドは全て同じ
}
```

#### 1.2 ユーザー作成フロー

```typescript
// 新規Supabaseユーザーの作成
export async function createUserFromSupabaseAuth(authUser: any) {
  return await prisma.user.create({
    data: {
      id: authUser.id, // Supabase auth.users.idをそのまま使用
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email.split("@")[0],
      primaryAuthMethod: "supabase",
    },
  });
}

// 既存NextAuthユーザーの作成（変更なし）
export async function createUserFromNextAuth(userData: any) {
  return await prisma.user.create({
    data: {
      id: cuid(), // 既存のcuid生成
      email: userData.email,
      name: userData.name,
      primaryAuthMethod: "nextauth",
    },
  });
}
```

### **Step 2: 認証フローの実装**

#### 2.1 Supabase Auth認証

```typescript
// src/app/login/supabase/page.tsx
export default function SupabaseLoginPage() {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };
}
```

#### 2.2 認証コールバック

```typescript
// src/app/auth/callback/page.tsx
export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (data.session) {
        // ユーザー同期（新規の場合は作成）
        const response = await fetch("/api/auth/sync-supabase-user", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        router.push("/dashboard");
      }
    };

    handleCallback();
  }, []);
}
```

#### 2.3 API同期エンドポイント

```typescript
// src/app/api/auth/sync-supabase-user/route.ts
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return createErrorResponse("認証トークンが必要です", 401);
  }

  const user = await syncUserFromToken(token);

  if (!user) {
    return createErrorResponse("ユーザー同期に失敗しました", 500);
  }

  return createApiResponse({ user });
}
```

### **Step 3: 段階的移行**

#### 3.1 フェーズ1：並行稼働

- NextAuth認証は継続稼働
- Supabase Auth認証を新規追加
- 新規ユーザーはSupabase Authを推奨

#### 3.2 フェーズ2：移行促進

- 既存ユーザーにSupabase Auth移行を案内
- 任意での移行サポート

#### 3.3 フェーズ3：統一

- NextAuth認証の段階的廃止
- 全ユーザーがSupabase Authに移行完了

## 💡 この設計の利点

### **シンプルさ**

- ✅ 既存データ構造の維持
- ✅ 複雑な移行処理不要
- ✅ 段階的な移行が可能

### **安全性**

- ✅ 既存ユーザーへの影響なし
- ✅ ロールバックが容易
- ✅ データ損失リスクなし

### **効率性**

- ✅ 新規ユーザーは最初からSupabase Auth
- ✅ 既存システムとの並行稼働
- ✅ Stripe統合はPhase 1で対応済み

## 🚀 実装手順

1. **Supabase Auth設定**（OAuth プロバイダー有効化）
2. **認証フローの実装**（並行稼働）
3. **ユーザー同期システム**の構築
4. **段階的移行**の開始
5. **NextAuth廃止**（最終段階）

---

**結論**: 既存データを保護しながら、シンプルで安全な移行が実現できます。
