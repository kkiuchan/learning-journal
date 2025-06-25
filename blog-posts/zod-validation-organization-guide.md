# Zod バリデーション整理ガイド：学習ログアプリでの実装状況と改善策

## 🎯 はじめに

TypeScriptプロジェクトでAPIのバリデーションを実装する際、「どのAPIにZodを使って、どのAPIが手動バリデーションのままなのか」を把握するのは重要です。

この記事では、学習ログアプリでの実際のZod使用状況を分析し、一貫性のあるバリデーション戦略を構築する方法を解説します。

## 📊 現在のZod使用状況分析

### ✅ **Zodバリデーションが実装済みのAPI**

#### **1. 認証関連**

```typescript
// src/types/auth.ts
export const authRequestSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  name: z.string().min(1, "名前は1文字以上で入力してください"),
});

// 使用箇所: /api/auth/register, /api/auth/link-account
```

#### **2. ログ管理**

```typescript
// src/types/log.ts
export const logRequestSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  learningTime: z.number().min(0, "学習時間は0以上である必要があります"),
  note: z.string().min(1, "ノートは必須です"),
  logDate: z.string().min(1, "ログ日は必須です"),
  effectScore: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  resources: z.array(/* ... */).optional(),
});

// 使用箇所: /api/units/[id]/logs, /api/units/[id]/logs/[logId]
```

#### **3. ユーザー管理**

```typescript
// src/app/api/users/me/route.ts
const updateUserSchema = z.object({
  name: z.string().nullable().optional(),
  selfIntroduction: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  skills: z.array(z.string().min(1).max(50)).max(10).optional(),
  interests: z.array(z.string().min(1).max(50)).max(10).optional(),
});
```

### ❌ **Zodバリデーションが未実装のAPI**

#### **1. ユニット作成（修正前）**

```typescript
// 修正前: 手動バリデーション
export async function POST(req: NextRequest) {
  const { title } = body;
  if (!title) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }
  // その他のフィールドはバリデーションなし
}
```

#### **2. その他のAPI**

- コメント作成
- いいね機能
- 一部の検索API

## 🔧 ユニットAPIのZod化改善実装

### **1. Zodスキーマの設計**

```typescript
// src/types/unit.ts
import { z } from "zod";

// 基本スキーマ（refineなし）
const baseUnitSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  learningGoal: z
    .string()
    .max(1000, "学習目標は1000文字以内で入力してください")
    .optional(),
  preLearningState: z
    .string()
    .max(1000, "事前学習状態は1000文字以内で入力してください")
    .optional(),
  reflection: z
    .string()
    .max(2000, "振り返りは2000文字以内で入力してください")
    .optional(),
  nextAction: z
    .string()
    .max(1000, "次のアクションは1000文字以内で入力してください")
    .optional(),
  startDate: z.string().datetime("開始日の形式が正しくありません").optional(),
  endDate: z.string().datetime("終了日の形式が正しくありません").optional(),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED"], {
      errorMap: () => ({ message: "ステータスが無効です" }),
    })
    .optional(),
  displayFlag: z.boolean().optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "タグは1文字以上で入力してください")
        .max(50, "タグは50文字以内で入力してください")
    )
    .max(10, "タグは10個まで設定できます")
    .optional(),
});

// 作成用スキーマ（日付バリデーション付き）
export const unitCreateSchema = baseUnitSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: "終了日は開始日より後の日付を設定してください",
    path: ["endDate"],
  }
);

// 更新用スキーマ（全フィールドオプショナル + 達成度）
export const unitUpdateSchema = baseUnitSchema
  .partial()
  .extend({
    achievementLevel: z
      .number()
      .min(0, "達成度は0以上で入力してください")
      .max(100, "達成度は100以下で入力してください")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "終了日は開始日より後の日付を設定してください",
      path: ["endDate"],
    }
  );

export type UnitCreateRequest = z.infer<typeof unitCreateSchema>;
export type UnitUpdateRequest = z.infer<typeof unitUpdateSchema>;
```

### **2. APIでのZodバリデーション実装**

```typescript
// src/app/api/units/route.ts
import { unitCreateSchema } from "@/types/unit";
import { z } from "zod";

export const POST = withApiSecurity(
  async (req: NextRequest, userOrContext?: any) => {
    try {
      const user = userOrContext?.user || userOrContext;

      if (!user?.id) {
        return createErrorResponse("認証情報が不正です", 401);
      }

      const body = await req.json();

      // Zodバリデーション
      const validationResult = unitCreateSchema.safeParse(body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        console.log("バリデーションエラー:", errors);

        return createErrorResponse(
          `バリデーションエラー: ${errors.map((e) => e.message).join(", ")}`,
          400
        );
      }

      // バリデーション済みデータを使用
      const {
        title,
        learningGoal,
        preLearningState,
        reflection,
        nextAction,
        startDate,
        endDate,
        status = "PLANNED",
        displayFlag = true,
        tags = [],
      } = validationResult.data;

      // ユニット作成処理...
    } catch (error) {
      // Zodバリデーションエラーの場合
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        return createErrorResponse(
          `入力値が正しくありません: ${errors.map((e) => e.message).join(", ")}`,
          400
        );
      }

      return createErrorResponse(
        error instanceof Error ? error.message : "サーバーエラー",
        500
      );
    }
  }
);
```

## 📋 Zodバリデーション設計のベストプラクティス

### **1. スキーマの階層化**

```typescript
// 基本スキーマを定義
const baseSchema = z.object({
  // 共通フィールド
});

// 作成用（必須フィールド多め）
export const createSchema = baseSchema.extend({
  // 作成時のみ必要なフィールド
});

// 更新用（全フィールドオプショナル）
export const updateSchema = baseSchema.partial().extend({
  // 更新時のみ必要なフィールド
});
```

### **2. カスタムバリデーション**

```typescript
// 日付の整合性チェック
const dateValidationSchema = baseSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: "終了日は開始日より後の日付を設定してください",
    path: ["endDate"],
  }
);

// 文字列の長さと内容チェック
const contentValidationSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください")
    .refine((val) => val.trim().length > 0, "タイトルは空白のみにはできません"),
});
```

### **3. エラーハンドリングパターン**

```typescript
// 統一されたエラーレスポンス
const handleValidationError = (error: z.ZodError) => {
  const errors = error.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  console.log("バリデーションエラー:", errors);

  return createErrorResponse(
    `バリデーションエラー: ${errors.map((e) => e.message).join(", ")}`,
    400
  );
};

// APIでの使用
try {
  const validationResult = schema.safeParse(body);

  if (!validationResult.success) {
    return handleValidationError(validationResult.error);
  }

  // 処理続行...
} catch (error) {
  if (error instanceof z.ZodError) {
    return handleValidationError(error);
  }
  // その他のエラー処理...
}
```

## 🎯 Zodバリデーション整理チェックリスト

### **Phase 1: 現状把握**

- [ ] 全APIのバリデーション実装状況を調査
- [ ] 手動バリデーションとZodバリデーションを分類
- [ ] 重複するバリデーションロジックを特定

### **Phase 2: スキーマ設計**

- [ ] 各エンティティごとにZodスキーマを作成
- [ ] 作成・更新・検索用のスキーマを分離
- [ ] カスタムバリデーションルールを実装

### **Phase 3: API改修**

- [ ] 手動バリデーションをZodに置き換え
- [ ] エラーハンドリングを統一
- [ ] テストケースを追加

### **Phase 4: フロントエンド対応**

- [ ] フォームバリデーションでZodスキーマを再利用
- [ ] react-hook-formとの連携
- [ ] エラーメッセージの統一

## 📊 改善効果の測定

### **Before（手動バリデーション）**

```typescript
// バリデーションが散在
if (!title) return error("タイトルは必須");
if (title.length > 200) return error("タイトルが長すぎます");
if (tags && tags.length > 10) return error("タグは10個まで");
// エラーメッセージが統一されていない
```

### **After（Zodバリデーション）**

```typescript
// 一箇所で定義、再利用可能
const schema = z.object({
  title: z.string().min(1).max(200),
  tags: z.array(z.string()).max(10).optional(),
});

// 統一されたエラーハンドリング
const result = schema.safeParse(data);
if (!result.success) {
  return handleValidationError(result.error);
}
```

### **改善効果**

1. **保守性**: バリデーションロジックの一元管理
2. **一貫性**: 統一されたエラーメッセージ
3. **型安全性**: TypeScriptとの完全な連携
4. **再利用性**: フロントエンドでのスキーマ再利用
5. **テスタビリティ**: バリデーションの単体テストが容易

## 🔄 継続的な改善

### **1. 定期的な見直し**

- 新しいAPIが追加された際のZod適用
- バリデーションルールの妥当性確認
- パフォーマンスの監視

### **2. チーム内での標準化**

- Zodスキーマの命名規則統一
- エラーハンドリングパターンの文書化
- レビュー時のチェックポイント作成

### **3. 段階的な移行**

- 重要度の高いAPIから優先的に移行
- 既存の手動バリデーションとの併用期間を設定
- 十分なテストを実施してから本格運用

## 💡 まとめ

Zodによるバリデーション整理は、以下の順序で進めることで効率的に実施できます：

1. **現状分析**: 既存のバリデーション実装を把握
2. **スキーマ設計**: 再利用可能なZodスキーマを作成
3. **段階的移行**: 重要なAPIから順次移行
4. **統一化**: エラーハンドリングとメッセージを統一
5. **継続改善**: 定期的な見直しと最適化

適切なZodバリデーションの実装により、コードの品質向上と開発効率の向上を同時に実現できます。
