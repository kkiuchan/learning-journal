# 🎭 Jest `mockImplementation` 完全ガイド：テストの魔法を解き放つ

## はじめに

JavaScript/TypeScript でのテストを書いていると、必ず遭遇するのが「モック」の世界です。特に **`mockImplementation`** は、テストの柔軟性を大幅に向上させる強力な機能ですが、その真価を理解している開発者は意外に少ないのが現実です。

本記事では、`mockImplementation` の基本から応用まで、実際のプロジェクトで使える実践的な知識を包括的に解説します。また、`spyOn` との組み合わせパターンや、テストの品質を向上させるベストプラクティスも詳しく紹介します。

## 📚 目次

1. [mockImplementation とは何か？](#mockImplementation-とは何か)
2. [基本的な使用法](#基本的な使用法)
3. [spyOn との完璧な組み合わせ](#spyOn-との完璧な組み合わせ)
4. [実践的な使用例](#実践的な使用例)
5. [高度なテクニック](#高度なテクニック)
6. [よくある間違いと解決策](#よくある間違いと解決策)
7. [ベストプラクティス](#ベストプラクティス)
8. [まとめ](#まとめ)

---

## mockImplementation とは何か？

### 💡 基本概念

`mockImplementation` は、Jest のモック関数に **カスタムロジック** を持たせるためのメソッドです。単純な戻り値設定（`mockReturnValue`）とは異なり、実際の関数のような複雑な処理を実装できます。

```typescript
// 単純な戻り値設定
const mockSimple = jest.fn().mockReturnValue("固定値");

// カスタムロジックを持つ実装
const mockComplex = jest.fn().mockImplementation((input: string) => {
  if (input.includes("error")) {
    throw new Error("エラーが発生しました");
  }
  return `処理結果: ${input}`;
});
```

### 🎯 なぜ重要なのか？

現実のアプリケーションでは、関数やメソッドが以下のような複雑な動作をすることがあります：

- **条件分岐**: 入力値によって異なる処理
- **副作用**: データベースへの書き込み、ファイル操作
- **非同期処理**: API コール、Promise の処理
- **エラーハンドリング**: 例外の発生と処理

`mockImplementation` を使用することで、これらの複雑な動作を **テスト環境で完全に制御** できるようになります。

---

## 基本的な使用法

### 🔧 引数なしの場合

```typescript
// 引数なし = 何もしない関数
const mockFn = jest.fn().mockImplementation();

mockFn("any", "arguments"); // undefined を返す
expect(mockFn).toHaveBeenCalledWith("any", "arguments"); // 呼び出しは記録される
```

**何が起こるか：**

- 関数は呼び出される
- 引数は記録される
- 戻り値は `undefined`
- 副作用は一切発生しない

### 🎨 カスタムロジックの実装

```typescript
// バリデーション処理のモック
const mockValidator = jest.fn().mockImplementation((data: any) => {
  const errors: string[] = [];

  if (!data.email) errors.push("メールアドレスが必要です");
  if (data.email && !data.email.includes("@")) {
    errors.push("有効なメールアドレスを入力してください");
  }
  if (!data.password) errors.push("パスワードが必要です");
  if (data.password && data.password.length < 8) {
    errors.push("パスワードは8文字以上で入力してください");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
});

// テスト実行
const result = mockValidator({
  email: "invalid-email",
  password: "short",
});

expect(result).toEqual({
  valid: false,
  errors: [
    "有効なメールアドレスを入力してください",
    "パスワードは8文字以上で入力してください",
  ],
});
```

### ⚡ 非同期処理の mockImplementation

```typescript
const mockAsyncOperation = jest
  .fn()
  .mockImplementation(async (delay: number) => {
    // 実際の遅延はしない（テストを高速化）
    if (delay > 1000) {
      throw new Error("タイムアウト");
    }
    return `処理完了: ${delay}ms`;
  });

// 使用例
const result = await mockAsyncOperation(500);
expect(result).toBe("処理完了: 500ms");

await expect(mockAsyncOperation(2000)).rejects.toThrow("タイムアウト");
```

---

## spyOn との完璧な組み合わせ

### 🕵️ spyOn の基本概念

`spyOn` は、**既存のオブジェクトのメソッドを監視・制御** するためのJest機能です。`mockImplementation` と組み合わせることで、既存の API や関数の動作を完全に制御できます。

### 🎯 基本的な組み合わせパターン

```typescript
// Math.random の完全制御
const mathSpy = jest.spyOn(Math, "random").mockImplementation(() => 0.5);

expect(Math.random()).toBe(0.5); // 常に0.5
expect(Math.random()).toBe(0.5); // 常に0.5
expect(mathSpy).toHaveBeenCalledTimes(2);

mathSpy.mockRestore(); // 元の動作に戻す
```

### 📅 Date オブジェクトの制御

```typescript
const fixedDate = new Date("2023-12-25T10:00:00.000Z");

const dateSpy = jest.spyOn(global, "Date").mockImplementation(() => fixedDate);

// テスト中はすべての new Date() が固定日時を返す
const now = new Date();
expect(now).toBe(fixedDate);

dateSpy.mockRestore();
```

### 💾 localStorage の完全モック

```typescript
const mockStorage: { [key: string]: string } = {};

const getItemSpy = jest
  .spyOn(Storage.prototype, "getItem")
  .mockImplementation((key: string) => mockStorage[key] || null);

const setItemSpy = jest
  .spyOn(Storage.prototype, "setItem")
  .mockImplementation((key: string, value: string) => {
    mockStorage[key] = value;
  });

const removeItemSpy = jest
  .spyOn(Storage.prototype, "removeItem")
  .mockImplementation((key: string) => {
    delete mockStorage[key];
  });

// テスト実行
localStorage.setItem("user", "太郎");
expect(localStorage.getItem("user")).toBe("太郎");

localStorage.removeItem("user");
expect(localStorage.getItem("user")).toBeNull();

// 呼び出し確認
expect(setItemSpy).toHaveBeenCalledWith("user", "太郎");
expect(removeItemSpy).toHaveBeenCalledWith("user");

// 全て元に戻す
getItemSpy.mockRestore();
setItemSpy.mockRestore();
removeItemSpy.mockRestore();
```

---

## 実践的な使用例

### 🌐 fetch API の完全モック

```typescript
const mockFetch = jest
  .spyOn(global, "fetch")
  .mockImplementation(async (url: string) => {
    // URL に応じて異なるレスポンスを返す
    if (url.includes("/api/users/1")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, name: "太郎", email: "taro@example.com" }),
      } as Response);
    }

    if (url.includes("/api/users/2")) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: "ユーザーが見つかりません" }),
      } as Response);
    }

    if (url.includes("/api/slow-endpoint")) {
      // 遅いエンドポイントのシミュレーション
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ message: "遅いレスポンス" }),
      } as Response);
    }

    throw new Error(`想定外のURL: ${url}`);
  });

// テスト実行
describe("API 呼び出しテスト", () => {
  test("成功ケース", async () => {
    const response = await fetch("/api/users/1");
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toEqual({ id: 1, name: "太郎", email: "taro@example.com" });
  });

  test("エラーケース", async () => {
    const response = await fetch("/api/users/2");
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  afterAll(() => {
    mockFetch.mockRestore();
  });
});
```

### 🔄 リトライ処理のテスト

```typescript
const mockApiCall = jest
  .fn()
  .mockRejectedValueOnce(new Error("503 Service Unavailable"))
  .mockRejectedValueOnce(new Error("502 Bad Gateway"))
  .mockResolvedValueOnce({ data: "成功" });

// リトライ処理をテスト
const apiWithRetry = async (url: string, maxRetries: number = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await mockApiCall(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // 実際のアプリでは await delay(1000) など
    }
  }
};

test("リトライ処理", async () => {
  const result = await apiWithRetry("/api/data");
  expect(result).toEqual({ data: "成功" });
  expect(mockApiCall).toHaveBeenCalledTimes(3);
});
```

### 🎭 状態を持つサービスクラスのモック

```typescript
class MockCacheService {
  private cache = new Map<string, any>();

  get = jest.fn().mockImplementation((key: string) => {
    return this.cache.get(key);
  });

  set = jest.fn().mockImplementation((key: string, value: any) => {
    this.cache.set(key, value);
    return true;
  });

  delete = jest.fn().mockImplementation((key: string) => {
    return this.cache.delete(key);
  });

  clear = jest.fn().mockImplementation(() => {
    this.cache.clear();
  });
}

test("キャッシュサービス", () => {
  const mockCache = new MockCacheService();

  // 初期状態
  expect(mockCache.get("key1")).toBeUndefined();

  // 設定・取得
  mockCache.set("key1", "value1");
  expect(mockCache.get("key1")).toBe("value1");

  // 削除
  expect(mockCache.delete("key1")).toBe(true);
  expect(mockCache.get("key1")).toBeUndefined();

  // モック関数の呼び出し確認
  expect(mockCache.get).toHaveBeenCalledTimes(3);
  expect(mockCache.set).toHaveBeenCalledWith("key1", "value1");
  expect(mockCache.delete).toHaveBeenCalledWith("key1");
});
```

---

## 高度なテクニック

### 🎯 動的な動作変更

```typescript
let callCount = 0;
const mockDynamicFn = jest.fn().mockImplementation((input: string) => {
  callCount++;

  if (callCount === 1) return `初回: ${input}`;
  if (callCount === 2) return `2回目: ${input}`;
  if (callCount >= 3) return `3回目以降: ${input}`;
});

test("動的な動作変更", () => {
  expect(mockDynamicFn("test")).toBe("初回: test");
  expect(mockDynamicFn("test")).toBe("2回目: test");
  expect(mockDynamicFn("test")).toBe("3回目以降: test");
  expect(mockDynamicFn("test")).toBe("3回目以降: test");
});
```

### 🔗 チェーンメソッドとの組み合わせ

```typescript
const mockApiClient = jest
  .fn()
  .mockImplementationOnce(async (config) => {
    // 1回目：認証エラー
    if (config.url.includes("/api/secure")) {
      throw new Error("401 Unauthorized");
    }
    return { data: "1回目の成功" };
  })
  .mockImplementationOnce(async (config) => {
    // 2回目：レート制限
    throw new Error("429 Too Many Requests");
  })
  .mockImplementation(async (config) => {
    // 3回目以降：成功
    return { data: `成功: ${config.url}` };
  });

test("段階的な API 動作", async () => {
  // 1回目
  await expect(mockApiClient({ url: "/api/secure" })).rejects.toThrow("401");

  // 2回目
  await expect(mockApiClient({ url: "/api/data" })).rejects.toThrow("429");

  // 3回目以降
  const result = await mockApiClient({ url: "/api/users" });
  expect(result.data).toBe("成功: /api/users");
});
```

### 🎨 this コンテキストの活用

```typescript
const mockObject = {
  name: "テストオブジェクト",
  value: 42,

  greet: jest.fn().mockImplementation(function (this: any, message: string) {
    return `${this.name}: ${message}`;
  }),

  calculate: jest.fn().mockImplementation(function (
    this: any,
    multiplier: number
  ) {
    return this.value * multiplier;
  }),
};

test("this コンテキストの活用", () => {
  expect(mockObject.greet("こんにちは")).toBe("テストオブジェクト: こんにちは");
  expect(mockObject.calculate(2)).toBe(84);
});
```

---

## よくある間違いと解決策

### ❌ 間違い1: 非同期処理の戻り値の型

```typescript
// ❌ 間違い：Promiseを返さない
const mockWrongAsync = jest.fn().mockImplementation(() => "同期の値");

// これはエラーになる
// const result = await mockWrongAsync(); // Promise ではない

// ✅ 正しい：Promiseを返す
const mockCorrectAsync = jest.fn().mockImplementation(async () => "非同期の値");

const result = await mockCorrectAsync(); // 正常に動作
```

### ❌ 間違い2: spyOn の復元忘れ

```typescript
// ❌ 間違い：復元しない
const dateSpy = jest
  .spyOn(global, "Date")
  .mockImplementation(() => new Date("2023-01-01"));

// テスト後、他のテストに影響する可能性

// ✅ 正しい：必ず復元する
describe("Date テスト", () => {
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    dateSpy = jest
      .spyOn(global, "Date")
      .mockImplementation(() => new Date("2023-01-01"));
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  test("日付のテスト", () => {
    const now = new Date();
    expect(now.getFullYear()).toBe(2023);
  });
});
```

### ❌ 間違い3: 複雑すぎる mockImplementation

```typescript
// ❌ 間違い：複雑すぎる
const mockComplexFn = jest.fn().mockImplementation((input: any) => {
  // 100行以上の複雑なロジック
  // これはテストの可読性を損なう
});

// ✅ 正しい：シンプルに分割
const mockSimpleFn = jest.fn().mockImplementation((input: any) => {
  if (input.type === "user") return mockUserHandler(input);
  if (input.type === "order") return mockOrderHandler(input);
  throw new Error("Unknown type");
});

const mockUserHandler = (input: any) => ({ id: 1, name: input.name });
const mockOrderHandler = (input: any) => ({ id: 1, total: input.amount });
```

---

## ベストプラクティス

### 🎯 1. 明確な命名規則

```typescript
// ✅ 良い命名
const mockUserService = jest.fn();
const mockFetchUser = jest.fn();
const mockDatabaseConnection = jest.fn();

// ❌ 悪い命名
const mock1 = jest.fn();
const fn = jest.fn();
const test = jest.fn();
```

### 🎯 2. 適切な粒度での分割

```typescript
// ✅ 適切な粒度
const mockAuthService = {
  login: jest.fn().mockImplementation(async (credentials) => {
    if (credentials.email === "test@example.com") {
      return { success: true, token: "mock-token" };
    }
    throw new Error("Invalid credentials");
  }),

  logout: jest.fn().mockImplementation(async () => {
    return { success: true };
  }),

  getCurrentUser: jest.fn().mockImplementation(async () => {
    return { id: 1, name: "Test User" };
  }),
};
```

### 🎯 3. テストケースの明確化

```typescript
describe("UserService", () => {
  describe("fetchUser", () => {
    test("正常なユーザーIDでユーザー情報を取得", async () => {
      const mockApiClient = jest.fn().mockImplementation(async (url) => {
        if (url === "/api/users/1") {
          return { data: { id: 1, name: "太郎" } };
        }
        throw new Error("User not found");
      });

      const userService = new UserService(mockApiClient);
      const user = await userService.fetchUser("1");

      expect(user).toEqual({ id: 1, name: "太郎" });
      expect(mockApiClient).toHaveBeenCalledWith("/api/users/1");
    });

    test("存在しないユーザーIDでエラーを発生", async () => {
      const mockApiClient = jest.fn().mockImplementation(async () => {
        throw new Error("User not found");
      });

      const userService = new UserService(mockApiClient);

      await expect(userService.fetchUser("999")).rejects.toThrow(
        "User not found"
      );
    });
  });
});
```

### 🎯 4. 再利用可能なモックファクトリー

```typescript
// テストヘルパー
const createMockApiClient = (responses: { [key: string]: any }) => {
  return jest.fn().mockImplementation(async (url: string) => {
    if (responses[url]) {
      return responses[url];
    }
    throw new Error(`No mock response for ${url}`);
  });
};

// 使用例
test("複数のAPIコールのテスト", async () => {
  const mockApiClient = createMockApiClient({
    "/api/users/1": { data: { id: 1, name: "太郎" } },
    "/api/orders/1": { data: { id: 1, total: 1000 } },
  });

  const userService = new UserService(mockApiClient);
  const user = await userService.fetchUser("1");

  expect(user).toEqual({ id: 1, name: "太郎" });
});
```

---

## まとめ

### 🎯 重要なポイント

1. **`mockImplementation` は単純な戻り値設定を超えた柔軟性を提供**

   - 条件分岐、エラーハンドリング、非同期処理に対応
   - 実際のビジネスロジックに近い動作をテスト環境で再現

2. **`spyOn` との組み合わせで既存APIの完全制御が可能**

   - `Math.random`、`Date`、`fetch`、`localStorage` などを制御
   - 外部依存を排除した安定したテスト環境の構築

3. **適切な使用で保守性の高いテストを実現**
   - 明確な命名規則と適切な粒度での分割
   - 再利用可能なモックファクトリーの活用

### 🚀 次のステップ

- 実際のプロジェクトでの `mockImplementation` の導入
- チームでのモック戦略の統一
- より高度なテストパターンの学習（Integration Tests、E2E Tests）

`mockImplementation` をマスターすることで、テストの品質と保守性が大幅に向上します。まずは小さなプロジェクトから始めて、徐々に複雑なケースに挑戦していきましょう！

---

_この記事が皆さんのテスト技術向上に役立てば幸いです。質問やフィードバックがあれば、お気軽にコメントください！_
