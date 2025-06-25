# Next.js 画面遷移完全ガイド：4つの方法とその使い分け

Next.jsでの画面遷移には複数の方法があり、それぞれ異なる用途と特徴を持っています。この記事では、主要な4つの画面遷移方法について、**クライアントコンポーネントとサーバーコンポーネントでの使い分け**も含めて詳しく解説します。

## 🔍 クライアント vs サーバーコンポーネントでの使い分け

### サーバーコンポーネントで使用可能

- ✅ `<Link />` コンポーネント
- ✅ `redirect()` 関数
- ❌ `useRouter()` **使用不可**

### クライアントコンポーネントで使用可能

- ✅ `<Link />` コンポーネント
- ✅ `useRouter()` フック
- ❌ `redirect()` **使用不可**（例外: Server Actions内では可能）

## 1. `<Link />` コンポーネント（推奨・基本）

### 基本的な使い方

```tsx
import Link from "next/link";

// ✅ サーバーコンポーネントでも使用可能
export default function ServerNavigation() {
  return (
    <nav>
      <Link href="/about">Aboutページへ</Link>
      <Link href="/contact">お問い合わせ</Link>
      <Link href="/blog/123">ブログ記事</Link>
    </nav>
  );
}

// ✅ クライアントコンポーネントでも使用可能
("use client");

export function ClientNavigation() {
  return (
    <nav>
      <Link href="/dashboard">ダッシュボード</Link>
      <Link href="/profile">プロフィール</Link>
    </nav>
  );
}
```

### 特徴とメリット

- **App Router / Pages Router 両対応**
- **サーバー・クライアント両方で使用可能**
- **クライアントサイドナビゲーション（CSR）**で高速
- **事前フェッチ機能**：ユーザーがリンクにホバーした瞬間に自動でページをプリロード
- **SEO対応**：通常の`<a>`タグとして出力されるため、検索エンジンがリンクを認識可能

### 実践的な使用例

```tsx
// スタイリングと組み合わせ
<Link
  href="/dashboard"
  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
>
  ダッシュボード
</Link>

// 動的ルート
<Link href={`/users/${userId}`}>
  ユーザー詳細
</Link>

// クエリパラメータ付き
<Link href="/search?q=nextjs">
  検索結果
</Link>
```

### いつ使うべきか

- **通常のナビゲーションリンク**（ヘッダーメニュー、フッターリンクなど）
- **カード型コンポーネント**のクリック領域
- **パンくずリスト**
- **ページネーション**
- **サーバーコンポーネント**での遷移が必要な場合

## 2. `useRouter().push()`（動的・プログラム的遷移）

> ⚠️ **重要**: `useRouter`は**クライアントコンポーネントでのみ**使用可能

### 基本的な使い方

```tsx
"use client"; // ← 必須！

import { useRouter } from "next/navigation"; // ← App Router
// import { useRouter } from 'next/router'; // ← Pages Router の場合

export function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      await login(formData);
      // ログイン成功後にダッシュボードへ遷移
      router.push("/dashboard");
    } catch (error) {
      // エラー処理
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム内容 */}
      <button type="submit">ログイン</button>
    </form>
  );
}
```

### 主要なメソッド

```tsx
"use client";

const router = useRouter();

// 通常の遷移（履歴に追加）
router.push("/dashboard");

// 履歴を残さずに遷移
router.replace("/success");

// 戻る
router.back();

// 進む
router.forward();

// 特定の履歴位置に移動
router.go(-2); // 2つ前のページに戻る

// 現在のページをリフレッシュ
router.refresh();
```

### 条件付き遷移の例

```tsx
"use client";

const handleFormSubmit = async (data: FormData) => {
  const result = await submitForm(data);

  if (result.success) {
    // 成功時は完了ページへ
    router.push("/success");
  } else if (result.needsVerification) {
    // 確認が必要な場合は確認ページへ
    router.push("/verify");
  } else {
    // エラーの場合は現在のページに留まる
    setError(result.error);
  }
};
```

### いつ使うべきか

- **フォーム送信後**の遷移
- **条件付き遷移**（認証状態による分岐など）
- **非同期処理完了後**の遷移
- **プログラム的な制御**が必要な場面
- **ユーザーインタラクション**に基づく遷移

## 3. `redirect()`（サーバーサイドでリダイレクト）

> ⚠️ **重要**: `redirect()`は**サーバーコンポーネント**と**Server Actions**でのみ使用可能

### 基本的な使い方

```tsx
// ✅ サーバーコンポーネントで使用
// app/protected/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login"); // サーバーサイドでリダイレクト
  }

  return (
    <div>
      <h1>保護されたページ</h1>
      <p>ようこそ、{user.name}さん</p>
    </div>
  );
}
```

### 実践的な使用例

```tsx
// 権限チェック付きのページ
export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  return <AdminDashboard />;
}

// 設定に基づくリダイレクト
export default async function UserProfile({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser(params.id);

  if (!user) {
    redirect("/404");
  }

  if (user.isPrivate) {
    redirect("/private-profile");
  }

  return <UserProfileContent user={user} />;
}
```

### Server Actionsでの使用

```tsx
// ✅ Server Actions内でも使用可能
// app/actions.ts
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const post = await savePost({ title, content });

  // 作成完了後に投稿詳細ページへリダイレクト
  redirect(`/posts/${post.id}`);
}

// フォームでの使用例
export function CreatePostForm() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="タイトル" />
      <textarea name="content" placeholder="内容" />
      <button type="submit">投稿作成</button>
    </form>
  );
}
```

### 特徴

- **サーバーコンポーネント専用**
- **Server Actions**でも使用可能
- **HTTPステータス307**（Temporary Redirect）を返す
- **SEO対応**：検索エンジンが適切にリダイレクトを処理
- **セキュア**：サーバーサイドで実行されるため改ざんされない

### いつ使うべきか

- **認証・認可チェック**
- **データの存在確認**後のリダイレクト
- **Server Actions**での処理完了後
- **条件に基づく自動リダイレクト**
- **サーバーサイドでの安全な遷移**

## 4. `<Link />` の replace モード

### 基本的な使い方

```tsx
import Link from "next/link";

// ✅ サーバーコンポーネントでも使用可能
export function PaymentSuccess() {
  return (
    <div>
      <h1>決済完了</h1>
      <p>ありがとうございました。</p>

      {/* 戻るボタンで決済ページに戻れないようにする */}
      <Link href="/dashboard" replace>
        ダッシュボードに戻る
      </Link>
    </div>
  );
}
```

### useRouterでのreplace（クライアントコンポーネント）

```tsx
"use client";

const router = useRouter();

const handlePaymentComplete = async () => {
  await processPayment();

  // 決済完了後、履歴を残さずに完了ページへ
  router.replace("/payment/success");
};
```

### 実践的な使用例

```tsx
// ログインフォーム（クライアントコンポーネント）
"use client";

export function LoginForm() {
  const router = useRouter();

  const handleLogin = async (credentials: LoginData) => {
    const result = await login(credentials);

    if (result.success) {
      // ログイン成功後、ログインページの履歴を残さない
      router.replace("/dashboard");
    }
  };

  return <form onSubmit={handleLogin}>{/* フォーム内容 */}</form>;
}

// ステップ形式のフォーム（クライアントコンポーネント）
("use client");

export function MultiStepForm() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const goToNextStep = () => {
    if (step < 3) {
      // 各ステップ間では履歴を残さない
      router.replace(`/form/step-${step + 1}`);
      setStep(step + 1);
    }
  };

  return (
    <div>
      <h2>ステップ {step} / 3</h2>
      {/* ステップ内容 */}
      <button onClick={goToNextStep}>次へ</button>
    </div>
  );
}
```

### いつ使うべきか

- **決済・注文完了**後のページ遷移
- **ログイン・ログアウト**後の遷移
- **ステップ形式のフォーム**での進行
- **一時的なページ**（確認画面など）からの遷移

## 🎯 コンポーネント種別による使い分け戦略

### サーバーコンポーネントでの遷移戦略

```tsx
// ✅ 推奨パターン
export default async function ServerPage() {
  const user = await getCurrentUser();

  // 認証チェック
  if (!user) {
    redirect("/login"); // サーバーサイドで安全にリダイレクト
  }

  return (
    <div>
      <h1>サーバーページ</h1>
      {/* 通常のリンクは Link コンポーネント */}
      <Link href="/dashboard">ダッシュボード</Link>
      <Link href="/profile" replace>
        プロフィール
      </Link>
    </div>
  );
}
```

### クライアントコンポーネントでの遷移戦略

```tsx
"use client";

export function ClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplexNavigation = async () => {
    setLoading(true);
    try {
      const result = await someAsyncOperation();

      if (result.success) {
        router.push("/success");
      } else {
        router.push("/error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>クライアントページ</h1>
      {/* 静的なリンクは Link コンポーネント */}
      <Link href="/static-page">静的ページ</Link>

      {/* 動的な遷移は useRouter */}
      <button onClick={handleComplexNavigation} disabled={loading}>
        {loading ? "処理中..." : "複雑な遷移"}
      </button>
    </div>
  );
}
```

### ハイブリッドパターン（サーバー + クライアント）

```tsx
// サーバーコンポーネント
export default async function HybridPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>ハイブリッドページ</h1>
      {/* サーバーコンポーネント部分の静的リンク */}
      <Link href="/dashboard">ダッシュボード</Link>

      {/* クライアントコンポーネントに委譲 */}
      <InteractiveSection user={user} />
    </div>
  );
}

// クライアントコンポーネント
("use client");

function InteractiveSection({ user }: { user: User }) {
  const router = useRouter();

  const handleUserAction = async () => {
    // 複雑なロジック
    const result = await performUserAction(user.id);
    router.push(`/result/${result.id}`);
  };

  return <button onClick={handleUserAction}>ユーザーアクション実行</button>;
}
```

## 状況別おすすめ一覧

| 状況                         | コンポーネント種別 | 方法                                     | 理由                             |
| ---------------------------- | ------------------ | ---------------------------------------- | -------------------------------- |
| 通常のリンク                 | Server/Client      | `<Link href="..." />`                    | SEO対応、プリフェッチ、高速      |
| 認証チェック後のリダイレクト | Server             | `redirect()`                             | サーバーサイド、セキュア         |
| フォーム送信後の遷移         | Client             | `useRouter().push()`                     | 条件分岐、非同期処理対応         |
| 履歴を残したくない遷移       | Server/Client      | `router.replace()` or `<Link replace />` | UX向上、セキュリティ             |
| Server Action完了後          | Server Action      | `redirect()`                             | サーバーサイド処理後の安全な遷移 |
| 外部サイトへの遷移           | Client             | `window.location.href`                   | 外部リンク、フルリロード         |

## ⚠️ よくある間違いと対処法

### 1. サーバーコンポーネントでuseRouterを使用

```tsx
// ❌ エラーになる
export default function ServerPage() {
  const router = useRouter(); // Error: useRouter can only be used in Client Components

  return <div>...</div>;
}

// ✅ 正しい方法
export default async function ServerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login"); // サーバーコンポーネントではredirectを使用
  }

  return <div>...</div>;
}
```

### 2. クライアントコンポーネントでredirectを使用

```tsx
"use client";

// ❌ エラーになる
export function ClientPage() {
  const handleClick = () => {
    redirect("/dashboard"); // Error: redirect can only be used in Server Components
  };

  return <button onClick={handleClick}>移動</button>;
}

// ✅ 正しい方法
("use client");

export function ClientPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard"); // クライアントコンポーネントではuseRouterを使用
  };

  return <button onClick={handleClick}>移動</button>;
}
```

### 3. Server Actionsでの遷移

```tsx
// ✅ Server Actions内ではredirectが使用可能
export async function submitForm(formData: FormData) {
  const result = await processForm(formData);

  if (result.success) {
    redirect("/success"); // Server Actions内では使用可能
  }
}
```

## パフォーマンスの考慮事項

### プリフェッチの制御

```tsx
// プリフェッチを無効にする
<Link href="/heavy-page" prefetch={false}>
  重いページ
</Link>

// ホバー時のみプリフェッチ
<Link href="/page" prefetch="hover">
  ページ
</Link>
```

### 動的インポートと組み合わせ

```tsx
"use client";

const router = useRouter();

const navigateToHeavyPage = async () => {
  // 必要な時だけコンポーネントを読み込む
  const { HeavyComponent } = await import("./HeavyComponent");
  router.push("/heavy-page");
};
```

## エラーハンドリング

```tsx
"use client";

const router = useRouter();

const handleNavigation = async (path: string) => {
  try {
    await router.push(path);
  } catch (error) {
    console.error("Navigation failed:", error);
    // フォールバック処理
    window.location.href = path;
  }
};
```

## まとめ

Next.jsの画面遷移は、**コンポーネントの種別**と**用途**に応じて適切な方法を選択することが重要です：

### サーバーコンポーネントでは

1. **`<Link />`** - 基本的なナビゲーション
2. **`redirect()`** - 認証チェックや条件分岐での安全な遷移

### クライアントコンポーネントでは

1. **`<Link />`** - 静的なナビゲーション
2. **`useRouter().push()`** - プログラム的な制御
3. **`replace`モード** - 履歴を残さない遷移

### Server Actionsでは

1. **`redirect()`** - フォーム処理完了後の遷移

これらを適切に使い分けることで、**ユーザーエクスペリエンス**、**パフォーマンス**、**セキュリティ**の全てを向上させることができます。特にApp Routerでは、サーバーコンポーネントとクライアントコンポーネントの境界を意識した設計が重要になります。
