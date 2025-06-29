# テスト戦略ガイド

このプロジェクトでは、品質を保証し、回帰バグを防ぐために包括的なテスト戦略を採用しています。

## テストの種類

### 1. 単体テスト (Unit Tests)

**対象**: 純粋関数、ユーティリティ、バリデーション、ライブラリ関数
**ツール**: Jest
**目的**: 個別の関数やコンポーネントの正確性を確認

#### 対象となるファイル例:

- `src/lib/utils.ts` - ユーティリティ関数
- `src/validation/*.ts` - Zodバリデーションスキーマ
- `src/types/*.ts` - 型変換関数
- `src/lib/auth-helpers.ts` - 認証ヘルパー関数

#### 実行方法:

```bash
npm test                    # 単体テスト実行
npm run test:watch         # ウォッチモードで実行
npm run test:coverage      # カバレッジレポート付きで実行
```

### 2. 統合テスト (Integration Tests)

**対象**: Reactコンポーネント、API エンドポイント
**ツール**: Jest + React Testing Library + MSW
**目的**: コンポーネント間の相互作用やAPIエンドポイントの動作を確認

#### 対象となるファイル例:

- `src/components/ui/*.tsx` - UIコンポーネント
- `src/app/units/[id]/components/*.tsx` - ビジネスロジックを含むコンポーネント
- `src/app/api/**/*.ts` - APIエンドポイント

### 3. E2Eテスト (End-to-End Tests)

**対象**: ユーザーフロー全体
**ツール**: Cypress
**目的**: 実際のユーザーの使用パターンを再現し、アプリケーション全体の動作を確認

#### 対象となるシナリオ:

- ユーザー登録・ログイン・ログアウト
- 学習ユニットの作成・編集・削除
- 学習ログの作成・編集・削除
- ナビゲーションとページ遷移
- レスポンシブデザインの確認

#### 実行方法:

```bash
npm run cypress:open      # Cypress UIを開く
npm run cypress:run       # ヘッドレスモードで実行
npm run test:e2e          # E2Eテスト実行（エイリアス）
```

## テスト環境のセットアップ

### 依存関係のインストール:

```bash
npm install --save-dev \
  jest \
  jest-environment-jsdom \
  @types/jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  cypress \
  msw \
  next-router-mock
```

### 設定ファイル:

- `jest.config.js` - Jest設定
- `jest.setup.js` - テストセットアップ
- `cypress.config.ts` - Cypress設定
- `src/__mocks__/` - モックファイル

## テストの書き方ガイドライン

### 単体テスト

```typescript
// src/lib/__tests__/utils.test.ts
import { cn } from "../utils";

describe("cn function", () => {
  it("should merge class names correctly", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });
});
```

### コンポーネントテスト

```typescript
// src/components/__tests__/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../ui/button'

describe('Button Component', () => {
  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### APIテスト

```typescript
// src/app/api/__tests__/units.test.ts
import { NextRequest } from "next/server";
import { GET } from "../units/route";

describe("/api/units", () => {
  it("should return user units", async () => {
    const request = new NextRequest("http://localhost/api/units");
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

### E2Eテスト

```typescript
// cypress/e2e/auth.cy.ts
describe("Authentication", () => {
  it("should login successfully", () => {
    cy.visit("/auth/login");
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("password");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");
  });
});
```

## テストデータの管理

### MSW (Mock Service Worker)

APIリクエストをモックし、一貫したテストデータを提供:

```typescript
// src/__mocks__/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/units/:id", ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      title: "テストユニット",
      // ...
    });
  }),
];
```

### Cypressフィクスチャ

```typescript
// cypress/fixtures/user.json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

## テストのベストプラクティス

### 1. テストの命名規則

- **Describe**: テスト対象の機能や コンポーネント名
- **It**: 具体的な動作や期待される結果

### 2. テストの構造 (AAA パターン)

```typescript
it("should do something", () => {
  // Arrange - テストデータの準備
  const input = "test input";

  // Act - テスト対象の実行
  const result = someFunction(input);

  // Assert - 結果の検証
  expect(result).toBe("expected output");
});
```

### 3. data-testidの使用

UIテストでは、CSSクラスに依存せずに要素を特定:

```jsx
<Button data-testid="submit-button">送信</Button>
```

```typescript
cy.get('[data-testid="submit-button"]').click();
```

### 4. モックの適切な使用

- 外部依存関係（API、データベース）はモック
- 純粋関数やユーティリティはモックしない

### 5. テストの独立性

- 各テストは他のテストに依存しない
- 共有状態をクリーンアップ

## カバレッジ目標

- **全体**: 70%以上
- **ビジネスロジック**: 90%以上
- **ユーティリティ関数**: 95%以上
- **重要なAPIエンドポイント**: 85%以上

## CI/CD統合

### GitHub Actions設定例:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - run: npm ci
      - run: npm run test:coverage
      - run: npm run cypress:run
```

## トラブルシューティング

### よくある問題と解決方法:

#### 1. Next.js 関連のモックエラー

```typescript
// jest.setup.js
jest.mock("next/router", () => require("next-router-mock"));
```

#### 2. Supabase クライアントのモック

```typescript
jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    /* モック実装 */
  },
}));
```

#### 3. 非同期テストのタイムアウト

```typescript
it("should handle async operation", async () => {
  // タイムアウトを延長
  jest.setTimeout(10000);
  await someAsyncOperation();
}, 10000);
```

## 継続的改善

### 定期的に実施すべき項目:

1. **テストカバレッジの確認**と改善
2. **フレイキーテスト**の特定と修正
3. **テスト実行時間**の最適化
4. **新機能に対応したテスト**の追加
5. **テストコードのリファクタリング**

### メトリクス監視:

- テスト実行時間
- カバレッジ率
- 失敗率
- フレイキーテストの発生頻度

このテスト戦略により、高品質なコードベースを維持し、安心してリファクタリングや新機能開発を行うことができます。
