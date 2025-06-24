# 学習ログアプリに横断検索機能を追加した話

## 背景：なぜ横断検索が必要だったのか

学習ログアプリを運用していく中で、ユーザーから「あの時学んだ内容、どこに書いたっけ？」という声が多く聞かれるようになりました。

### 既存の検索機能の限界

当初の検索機能は**ユニット（学習単位）のタイトルや内容のみ**を対象としていました：

```typescript
// 従来の検索（ユニットのみ）
const where = {
  OR: [
    { title: { contains: query, mode: "insensitive" } },
    { learningGoal: { contains: query, mode: "insensitive" } },
    { reflection: { contains: query, mode: "insensitive" } },
  ],
};
```

### 実際に発生していた問題

1. **情報の断片化**: 詳細な学習内容は個別の学習ログに記録されているが検索対象外
2. **検索漏れ**: ユニットタイトルには含まれないが、ログに重要な情報が記載されているケース
3. **ユーザビリティの低下**: 「確かあの技術について書いたはず...」が見つからない

## 解決策：ユニット×学習ログの横断検索

### 🎯 実装目標

- **ユニット情報**: タイトル、学習目標、振り返り、次のアクション、タグ
- **学習ログ情報**: ログタイトル、ログ内容、ログタグ
- **シームレスな検索体験**: 一つの検索ボックスですべてを検索

### 📊 データ構造の確認

まず、現在のアプリのデータ構造を整理しました：

```prisma
model Unit {
  id               Int      @id @default(autoincrement())
  title            String
  learningGoal     String?
  preLearningState String?
  reflection       String?
  nextAction       String?

  // リレーション
  logs             Log[]
  unitTags         UnitTag[]
}

model Log {
  id     Int     @id @default(autoincrement())
  title  String
  note   String?
  unitId Int

  // リレーション
  unit     Unit      @relation(fields: [unitId], references: [id])
  logTags  LogTag[]
}
```

## 実装過程：試行錯誤の記録

### Phase 1: APIの拡張

既存の `/api/units` エンドポイントを拡張し、学習ログも検索対象に含めることにしました。

#### 最初のアプローチ（失敗）

```typescript
// ❌ 最初はこんな感じで書いてしまった
const units = await prisma.unit.findMany({
  include: { logs: true },
});

// フィルタリングをJavaScript側で実行
const filteredUnits = units.filter((unit) => {
  // ユニット内容をチェック
  if (unit.title.includes(query)) return true;

  // ログ内容をチェック
  return unit.logs.some(
    (log) => log.title.includes(query) || log.note?.includes(query)
  );
});
```

**問題点**:

- 全データを取得してからフィルタリング → パフォーマンス最悪
- ページネーションが正しく動作しない
- データベースの負荷が高い

#### 改善後のアプローチ（成功）

Prisma の関連検索機能を活用：

```typescript
// ✅ Prismaレベルで検索条件を構築
const where: Prisma.UnitWhereInput = {
  AND: [
    query
      ? {
          OR: [
            // ユニット内容検索
            { title: { contains: query, mode: "insensitive" } },
            { learningGoal: { contains: query, mode: "insensitive" } },
            { reflection: { contains: query, mode: "insensitive" } },

            // 🔥 ここが核心：ログ内容検索
            {
              logs: {
                some: {
                  OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { note: { contains: query, mode: "insensitive" } },
                    {
                      logTags: {
                        some: {
                          tag: {
                            name: { contains: query, mode: "insensitive" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {},
  ],
};
```

### Phase 2: フロントエンドの改善

#### 検索体験の向上

```typescript
// useTransition でパフォーマンス最適化
const [isPending, startTransition] = useTransition();

const handleSearch = useCallback((newQuery: string) => {
  // 入力フィールドは即座に更新
  setSearchInput(newQuery);

  // 重い検索処理は遅延実行
  startTransition(() => {
    setFilteredSearchQuery(newQuery);
  });
}, []);
```

#### UIの改善

```typescript
// プレースホルダーでユーザーに検索範囲を明示
<Input
  placeholder="ユニット名・内容・学習ログから検索..."
  value={searchInput}
  onChange={(e) => handleSearch(e.target.value)}
/>

// ローディング状態の表示
{isPending && (
  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
  </div>
)}
```

## 技術的な学び

### 1. Prisma の `some` キーワードの威力

```typescript
logs: {
  some: {
    /* 条件 */
  }
}
```

**学んだこと**: 「関連するレコードの中に、条件を満たすものが少なくとも1つ存在する」という検索が可能。これにより、ユニットに複数のログがあっても、1つでもマッチすれば結果に含まれる。

### 2. ネストしたOR条件の構築

```typescript
logs: {
  some: {
    OR: [
      { title: { contains: query } },
      { note: { contains: query } },
      { logTags: { some: { tag: { name: { contains: query } } } } },
    ];
  }
}
```

**学んだこと**: 複雑な検索条件も、Prisma の型安全性を保ちながら構築できる。

### 3. パフォーマンスの考慮

#### データベースインデックスの追加

```sql
-- 検索パフォーマンス向上のため追加
CREATE INDEX idx_units_title ON units(title);
CREATE INDEX idx_logs_title ON logs(title);
CREATE INDEX idx_logs_note ON logs(note);
CREATE INDEX idx_tags_name ON tags(name);
```

#### クエリの最適化

```typescript
// 必要なデータのみを取得
const [units, total] = await Promise.all([
  prisma.unit.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
      unitTags: { include: { tag: true } },
      _count: { select: { logs: true, unitLikes: true } },
    },
  }),
  prisma.unit.count({ where }),
]);
```

## 実装結果：ユーザー体験の向上

### Before（従来）

- 「React hooks」で検索 → ユニットタイトルに含まれるもののみヒット
- 詳細な実装メモは学習ログに記載されているが見つからない

### After（改善後）

- 「React hooks」で検索 → ユニット + 学習ログの両方から検索
- 学習ログに「useEffect の使い方で苦戦した」と書かれていても発見可能

### 実際の検索例

#### 「useState」で検索した場合

以下すべてがヒットするようになりました：

- ✅ ユニットタイトル: 「**useState**の基本」
- ✅ 学習目標: 「**useState**の使い方を学ぶ」
- ✅ **ログタイトル**: 「**useState**実装記録」
- ✅ **ログ内容**: 「**useState**を使って状態管理を行った」
- ✅ ログタグ: 「**useState**」

## 運用での気づき

### 1. 検索結果の表示方法

学習ログにマッチした場合でも**ユニット単位**で結果を表示する設計にしました。

**理由**:

- 統一感のあるUI
- コンテキストの保持（ログだけでなく、そのログが属するユニット全体も確認可能）
- ナビゲーションの簡素化

### 2. デバウンス処理の重要性

```typescript
const debouncedSearchInput = useDebouncedValue(searchInput, 500);
```

**学び**: 検索対象が増えたことで、リアルタイム検索の負荷が増加。デバウンス処理により、ユーザビリティを保ちながらパフォーマンスを確保。

## 今後の改善予定

### 1. 検索結果のハイライト

```typescript
// 実装予定
function highlightSearchTerm(text: string, searchTerm: string) {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}
```

### 2. 検索スコアリング

```typescript
// 検索結果の重み付け（検討中）
const searchScore = {
  unitTitle: 10, // ユニットタイトルマッチ: 高スコア
  unitContent: 7, // ユニット内容マッチ: 中スコア
  logTitle: 5, // ログタイトルマッチ: 中スコア
  logContent: 3, // ログ内容マッチ: 低スコア
  tags: 2, // タグマッチ: 低スコア
};
```

### 3. 高度な検索フィルター

- 検索範囲の指定（「ユニットのみ」「ログのみ」）
- 日付範囲での絞り込み
- 特定のタグでの絞り込み

## まとめ：機能拡張から得られた学び

### 技術的な学び

1. **Prisma の関連検索機能**の活用方法
2. **useTransition**によるパフォーマンス最適化
3. **適切なインデックス設計**の重要性

### プロダクト開発の学び

1. **ユーザーの声を聞く**ことの重要性
2. **段階的な改善**の効果
3. **パフォーマンスとユーザビリティのバランス**

### 今回の機能拡張の成果

- 検索ヒット率の向上
- ユーザーの学習記録発見率の改善
- アプリの継続利用率の向上

この横断検索機能の実装により、学習ログアプリはより実用的なツールへと進化しました。ユーザーが過去の学習内容を効率的に振り返れるようになり、継続的な学習をサポートする仕組みが強化されています。

関連テーブルをまたいだ検索は技術的に複雑でしたが、Prisma の強力な機能を活用することで、保守性の高いコードで実現できました。今後も継続的な改善を通じて、より良い学習体験を提供していきたいと思います。

---

**参考リンク**:

- [Prisma 公式ドキュメント - Filtering and Sorting](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- [React useTransition Hook](https://react.dev/reference/react/useTransition)
- [PostgreSQL 全文検索](https://www.postgresql.org/docs/current/textsearch.html)

```typescript
const jsonData = JSON.stringify(jsObject);
const jsObject2 = JSON.parse(jsonData);
```
