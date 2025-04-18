# 変更履歴

## [1.1.0] - 2024-03-21

### 変更

- ユニットステータスを英語に統一
  - データベースのステータス値を英語に変更
  - フロントエンドでの表示は日本語のまま
  - 翻訳機能を実装

### 詳細

- ステータス値の変更

  - `計画中` → `PLANNED`
  - `進行中` → `IN_PROGRESS`
  - `完了` → `COMPLETED`

- 型定義の整理

  - `UnitStatus`型の導入
  - 基本型（`BaseUnit`）の定義
  - データベース用（`DbUnit`）、API 用（`ApiUnit`）、フォーム用（`UnitForm`）の型を明確に分離

- 翻訳機能の実装
  - `src/utils/i18n.ts`に翻訳機能を実装
  - ステータスの翻訳を表示層で行うように変更

### マイグレーション

- データベースのステータス値を英語に変換するマイグレーションを実行
- 既存のデータを新しいステータス値に変換

### 影響範囲

- ユニット一覧画面
- ユニット詳細画面
- ユニット作成・編集画面
- ユーザープロフィール画面

### 注意点

- マイグレーション実行前にデータのバックアップを推奨
- フロントエンドの表示は変更なし（日本語のまま）
- API のレスポンスは英語のステータス値を返すように変更
