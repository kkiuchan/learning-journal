# 🧪 React UIテスト完全ガイド：基本から実践まで徹底解説

## はじめに

React アプリケーションの品質を確保するために、**UIテスト**は欠かせない要素です。しかし、「何をテストすべきか」「どのようにテストを書けば良いか」「どんなツールを使うべきか」など、多くの疑問を抱える開発者も多いのではないでしょうか。

本記事では、React UIテストの基本概念から実践的な技術、さらには実際のプロジェクトで使える高度なテスト戦略まで、包括的に解説します。学習ジャーナルプロジェクトでの実例も豊富に紹介し、すぐに活用できる知識を提供します。

## 📚 目次

1. [React UIテストの基本概念](#react-uiテストの基本概念)
2. [テストツールとセットアップ](#テストツールとセットアップ)
3. [基本的なテストの書き方](#基本的なテストの書き方)
4. [段階的テスト戦略](#段階的テスト戦略)
5. [実践的なテストパターン](#実践的なテストパターン)
6. [高度なテスト技術](#高度なテスト技術)
7. [よくある問題と解決策](#よくある問題と解決策)
8. [ベストプラクティス](#ベストプラクティス)
9. [まとめ](#まとめ)

---

## React UIテストの基本概念

### 🎯 UIテストとは何か？

**UIテスト**は、ユーザーインターフェースが期待通りに動作することを確認するテストです。React においては、以下の要素をテストします：

- **レンダリング**: コンポーネントが正しく表示されるか
- **インタラクション**: ユーザー操作（クリック、入力）が正しく動作するか
- **状態管理**: 状態の変化が適切に反映されるか
- **条件分岐**: 条件に応じて適切な UI が表示されるか

### 🏗️ テストの種類と範囲

```typescript
// テストの分類
const testTypes = {
  unit: {
    scope: "単一コンポーネント",
    focus: "個別の機能",
    speed: "高速",
    examples: ["Button", "Input", "Card"],
  },
  integration: {
    scope: "複数コンポーネント",
    focus: "連携動作",
    speed: "中速",
    examples: ["Form", "Modal", "DataTable"],
  },
  e2e: {
    scope: "アプリケーション全体",
    focus: "ユーザーワークフロー",
    speed: "低速",
    examples: ["ログイン", "購入", "投稿"],
  },
};
```

### 🎨 テストファーストの思想

```typescript
// テストファーストの例
describe("TodoItem Component", () => {
  test("should display todo text", () => {
    const todo = { id: 1, text: "Learn React Testing", completed: false };
    render(<TodoItem todo={todo} />);
    expect(screen.getByText("Learn React Testing")).toBeInTheDocument();
  });

  test("should call onToggle when checkbox is clicked", () => {
    const mockOnToggle = jest.fn();
    const todo = { id: 1, text: "Learn React Testing", completed: false };

    render(<TodoItem todo={todo} onToggle={mockOnToggle} />);
    fireEvent.click(screen.getByRole("checkbox"));

    expect(mockOnToggle).toHaveBeenCalledWith(1);
  });
});
```

---

## テストツールとセットアップ

### 🛠️ 主要なテストツール

#### **Jest**

- **役割**: テストランナー、アサーション、モック
- **特徴**: React アプリケーションの標準的なテストフレームワーク

#### **React Testing Library**

- **役割**: React コンポーネントのテスト用ライブラリ
- **特徴**: ユーザー中心のテストアプローチ

#### **@testing-library/jest-dom**

- **役割**: DOM 要素用のカスタムマッチャー
- **特徴**: より直感的なアサーション

### 🔧 セットアップ

```bash
# 必要なパッケージのインストール
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/reportWebVitals.ts",
  ],
};
```

```javascript
// src/setupTests.js
import "@testing-library/jest-dom";

// グローバルなモックの設定
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### 📦 Next.js での設定

```javascript
// next.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapping: {
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/pages/(.*)$": "<rootDir>/pages/$1",
  },
  testEnvironment: "jest-environment-jsdom",
};

module.exports = createJestConfig(customJestConfig);
```

---

## 基本的なテストの書き方

### 🎯 基本的なレンダリングテスト

```typescript
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge } from "@/components/ui/badge";

describe("Badge Component", () => {
  test("renders with default variant", () => {
    render(<Badge>Default Badge</Badge>);

    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-primary");
  });

  test("renders with custom variant", () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);

    const badge = screen.getByText("Secondary Badge");
    expect(badge).toHaveClass("bg-secondary");
  });

  test("applies custom className", () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);

    const badge = screen.getByText("Custom Badge");
    expect(badge).toHaveClass("custom-class");
  });
});
```

### 🖱️ ユーザーインタラクションのテスト

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "@/components/TagInput";

describe("TagInput Component", () => {
  const mockOnTagsChange = jest.fn();

  beforeEach(() => {
    mockOnTagsChange.mockClear();
  });

  test("adds tag when Enter key is pressed", async () => {
    const user = userEvent.setup();

    render(<TagInput onTagsChange={mockOnTagsChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "React");
    await user.keyboard("{Enter}");

    expect(mockOnTagsChange).toHaveBeenCalledWith(["react"]);
    expect(input).toHaveValue("");
  });

  test("removes tag when delete button is clicked", async () => {
    const user = userEvent.setup();

    render(<TagInput initialTags={["react", "testing"]} onTagsChange={mockOnTagsChange} />);

    const deleteButton = screen.getAllByText("×")[0];
    await user.click(deleteButton);

    expect(mockOnTagsChange).toHaveBeenCalledWith(["testing"]);
  });

  test("prevents duplicate tags", async () => {
    const user = userEvent.setup();

    render(<TagInput initialTags={["react"]} onTagsChange={mockOnTagsChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "React");
    await user.keyboard("{Enter}");

    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });
});
```

### 🔄 非同期処理のテスト

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

describe("DashboardStats Component", () => {
  test("displays loading state initially", () => {
    render(<DashboardStats />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("displays stats after loading", async () => {
    const mockStats = {
      totalUnits: 5,
      totalLogs: 25,
      totalLearningTime: 150,
      averageScore: 85.5
    };

    // APIモック
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockStats
    });

    render(<DashboardStats />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("85.5")).toBeInTheDocument();
    });
  });

  test("handles error state", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("API Error"));

    render(<DashboardStats />);

    await waitFor(() => {
      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    });
  });
});
```

---

## 段階的テスト戦略

### 📈 レベル1: 基本コンポーネント

```typescript
// Loading Component のテスト
describe("Loading Component", () => {
  test("renders loading spinner", () => {
    render(<Loading />);

    const spinner = document.querySelector("svg");
    expect(spinner).toBeTruthy();
  });

  test("displays custom text", () => {
    render(<Loading text="データを読み込み中..." />);

    expect(screen.getByText("データを読み込み中...")).toBeInTheDocument();
  });

  test("renders with different sizes", () => {
    const { rerender } = render(<Loading size="sm" />);

    const smallSpinner = document.querySelector("svg");
    expect(smallSpinner).toHaveClass("w-4", "h-4");

    rerender(<Loading size="lg" />);

    const largeSpinner = document.querySelector("svg");
    expect(largeSpinner).toHaveClass("w-8", "h-8");
  });
});
```

### 📈 レベル2: インタラクティブコンポーネント

```typescript
// Form Component のテスト
describe("ContactForm Component", () => {
  test("submits form with valid data", async () => {
    const mockOnSubmit = jest.fn();
    const user = userEvent.setup();

    render(<ContactForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("お名前"), "太郎");
    await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
    await user.type(screen.getByLabelText("メッセージ"), "お問い合わせ内容");

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: "太郎",
      email: "taro@example.com",
      message: "お問い合わせ内容"
    });
  });

  test("displays validation errors", async () => {
    const user = userEvent.setup();

    render(<ContactForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(screen.getByText("お名前は必須です")).toBeInTheDocument();
    expect(screen.getByText("メールアドレスは必須です")).toBeInTheDocument();
    expect(screen.getByText("メッセージは必須です")).toBeInTheDocument();
  });
});
```

### 📈 レベル3: 状態管理を含むコンポーネント

```typescript
// Dashboard Header のテスト
describe("DashboardHeader Component", () => {
  const mockUseAuthStore = jest.fn();
  const mockUseModalStore = jest.fn();
  const mockUseRouter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: jest.fn()
    });

    mockUseModalStore.mockReturnValue({
      openCreateUnitModal: jest.fn()
    });
  });

  test("displays loading state", () => {
    mockUseAuthStore.mockReturnValue({
      session: null,
      loading: true
    });

    render(<DashboardHeader />);

    expect(document.querySelector("svg")).toBeTruthy();
  });

  test("displays authenticated user content", () => {
    mockUseAuthStore.mockReturnValue({
      session: { user: { id: "user-123" } },
      loading: false
    });

    render(<DashboardHeader />);

    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(screen.getByText("新規ユニット")).toBeInTheDocument();
    expect(screen.getByText("プロフィール")).toBeInTheDocument();
  });
});
```

---

## 実践的なテストパターン

### 🎭 モックとスタブの活用

```typescript
// API呼び出しのモック
describe("UserProfile Component", () => {
  test("fetches and displays user data", async () => {
    const mockUser = {
      id: 1,
      name: "太郎",
      email: "taro@example.com",
      avatar: "https://example.com/avatar.jpg"
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUser
    });

    render(<UserProfile userId="1" />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("太郎")).toBeInTheDocument();
      expect(screen.getByText("taro@example.com")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/users/1");
  });
});
```

### 🔄 カスタムフックのテスト

```typescript
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

describe("useDebouncedValue Hook", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("初期値", 1000));

    expect(result.current).toBe("初期値");
  });

  test("delays value updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "初期値", delay: 1000 } }
    );

    expect(result.current).toBe("初期値");

    rerender({ value: "更新値", delay: 1000 });

    expect(result.current).toBe("初期値");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe("更新値");
  });
});
```

### 🎨 条件付きレンダリングのテスト

```typescript
describe("ConditionalComponent", () => {
  test("renders different content based on user role", () => {
    const adminUser = { role: "admin", name: "管理者" };
    const regularUser = { role: "user", name: "一般ユーザー" };

    const { rerender } = render(<UserDashboard user={adminUser} />);

    expect(screen.getByText("管理パネル")).toBeInTheDocument();
    expect(screen.getByText("ユーザー管理")).toBeInTheDocument();

    rerender(<UserDashboard user={regularUser} />);

    expect(screen.queryByText("管理パネル")).not.toBeInTheDocument();
    expect(screen.getByText("マイページ")).toBeInTheDocument();
  });

  test("handles empty state", () => {
    render(<DataList data={[]} />);

    expect(screen.getByText("データがありません")).toBeInTheDocument();
    expect(screen.getByText("新しいデータを追加してください")).toBeInTheDocument();
  });
});
```

---

## 高度なテスト技術

### 🔍 アクセシビリティのテスト

```typescript
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility Tests", () => {
  test("should not have any accessibility violations", async () => {
    const { container } = render(<ContactForm />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("form elements have proper labels", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText("お名前")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("メッセージ")).toBeInTheDocument();
  });

  test("buttons have proper aria attributes", () => {
    render(<SubmitButton loading={true} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("aria-describedby");
  });
});
```

### 📱 レスポンシブデザインのテスト

```typescript
describe("Responsive Design Tests", () => {
  test("displays mobile navigation on small screens", () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    window.dispatchEvent(new Event('resize'));

    render(<Navigation />);

    expect(screen.getByLabelText("メニューを開く")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeVisible();
  });

  test("displays desktop navigation on large screens", () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    window.dispatchEvent(new Event('resize'));

    render(<Navigation />);

    expect(screen.getByRole("navigation")).toBeVisible();
    expect(screen.queryByLabelText("メニューを開く")).not.toBeInTheDocument();
  });
});
```

### 🎯 パフォーマンステスト

```typescript
describe("Performance Tests", () => {
  test("renders large list efficiently", () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 100
    }));

    const start = performance.now();
    render(<VirtualizedList data={largeData} />);
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // 100ms以内
    expect(screen.getAllByTestId("list-item")).toHaveLength(10); // 仮想化確認
  });

  test("lazy loading works correctly", async () => {
    render(<LazyImageGrid />);

    const images = screen.getAllByRole("img");

    // 最初は数枚だけ読み込まれる
    expect(images.filter(img => img.getAttribute("src"))).toHaveLength(6);

    // スクロールで追加読み込み
    fireEvent.scroll(window, { target: { scrollY: 1000 } });

    await waitFor(() => {
      const loadedImages = screen.getAllByRole("img").filter(img => img.getAttribute("src"));
      expect(loadedImages.length).toBeGreaterThan(6);
    });
  });
});
```

---

## よくある問題と解決策

### ❌ 問題1: 非同期処理のテストが不安定

```typescript
// ❌ 間違い：固定時間での待機
test("bad async test", async () => {
  render(<AsyncComponent />);

  await new Promise(resolve => setTimeout(resolve, 1000));

  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// ✅ 正しい：waitForを使用
test("good async test", async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeInTheDocument();
  });
});
```

### ❌ 問題2: モックの設定が不適切

```typescript
// ❌ 間違い：グローバルモックの設定忘れ
describe("API Tests", () => {
  test("fetches data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" })
    });

    render(<DataComponent />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });
  });
});

// ✅ 正しい：適切なクリーンアップ
describe("API Tests", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    mockFetch.mockClear();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("fetches data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" })
    });

    render(<DataComponent />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });
  });
});
```

### ❌ 問題3: テストが環境に依存

```typescript
// ❌ 間違い：環境依存のテスト
test("bad environment test", () => {
  render(<Component />);

  expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
});

// ✅ 正しい：環境から独立したテスト
test("good environment test", () => {
  const mockDate = new Date("2023-01-01");
  jest.spyOn(global, "Date").mockImplementation(() => mockDate);

  render(<Component />);

  expect(screen.getByText("2023")).toBeInTheDocument();

  global.Date.mockRestore();
});
```

---

## ベストプラクティス

### 🎯 1. テストの命名規則

```typescript
// ✅ 良い命名
describe("UserProfile Component", () => {
  describe("when user is authenticated", () => {
    test("displays user information", () => {
      // テスト内容
    });

    test("shows edit button", () => {
      // テスト内容
    });
  });

  describe("when user is not authenticated", () => {
    test("displays login prompt", () => {
      // テスト内容
    });

    test("redirects to login page", () => {
      // テスト内容
    });
  });
});
```

### 🎯 2. Page Object Model の活用

```typescript
// テストヘルパー
class ContactFormPage {
  constructor(private component: RenderResult) {}

  async fillName(name: string) {
    const input = this.component.getByLabelText("お名前");
    await userEvent.type(input, name);
  }

  async fillEmail(email: string) {
    const input = this.component.getByLabelText("メールアドレス");
    await userEvent.type(input, email);
  }

  async fillMessage(message: string) {
    const input = this.component.getByLabelText("メッセージ");
    await userEvent.type(input, message);
  }

  async submit() {
    const button = this.component.getByRole("button", { name: "送信" });
    await userEvent.click(button);
  }

  getValidationError(field: string) {
    return this.component.queryByText(new RegExp(field, "i"));
  }
}

// 使用例
test("submits form with valid data", async () => {
  const mockOnSubmit = jest.fn();
  const component = render(<ContactForm onSubmit={mockOnSubmit} />);
  const page = new ContactFormPage(component);

  await page.fillName("太郎");
  await page.fillEmail("taro@example.com");
  await page.fillMessage("お問い合わせ内容");
  await page.submit();

  expect(mockOnSubmit).toHaveBeenCalledWith({
    name: "太郎",
    email: "taro@example.com",
    message: "お問い合わせ内容"
  });
});
```

### 🎯 3. テストデータの管理

```typescript
// testUtils.ts
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: "テストユーザー",
  email: "test@example.com",
  role: "user",
  createdAt: new Date("2023-01-01"),
  ...overrides
});

export const createMockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  headers: new Headers(),
  redirected: false,
  statusText: "OK",
  type: "default",
  url: ""
});

// 使用例
test("displays user profile", async () => {
  const mockUser = createMockUser({ name: "太郎", role: "admin" });

  global.fetch = jest.fn().mockResolvedValue(
    createMockApiResponse(mockUser)
  );

  render(<UserProfile userId="1" />);

  await waitFor(() => {
    expect(screen.getByText("太郎")).toBeInTheDocument();
    expect(screen.getByText("管理者")).toBeInTheDocument();
  });
});
```

### 🎯 4. カバレッジの活用

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --watchAll=false"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/utils/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.stories.{ts,tsx}"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

---

## まとめ

### 🎯 テスト戦略の要点

1. **段階的アプローチ**: 基本→応用→高度な順でテストを充実
2. **ユーザー中心**: 実際のユーザー操作を模倣したテスト
3. **保守性重視**: 変更に強く、理解しやすいテスト
4. **自動化**: CI/CDパイプラインとの統合

### 🔑 重要なポイント

| 要素                   | 重要度 | 説明                          |
| ---------------------- | ------ | ----------------------------- |
| **基本機能**           | ★★★    | レンダリング、props、イベント |
| **エラーハンドリング** | ★★★    | 異常系のテスト                |
| **アクセシビリティ**   | ★★☆    | a11y要件の確認                |
| **パフォーマンス**     | ★☆☆    | 大量データ、レスポンシブ      |

### 🚀 次のステップ

1. **実際のプロジェクトで段階的に導入**
2. **チームでのテスト文化の醸成**
3. **CI/CDパイプラインでの自動テスト**
4. **E2Eテストとの組み合わせ**

React UIテストをマスターすることで、より安定した高品質なアプリケーションを開発できます。まずは基本的なテストから始めて、徐々に高度なテクニックを習得していきましょう！

---

_この記事が皆さんのReact開発とテスト技術の向上に役立てば幸いです。実際のプロジェクトでの実践を通じて、さらなるスキルアップを目指してください！_
