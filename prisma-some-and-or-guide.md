# Prisma の some と OR/AND を使いこなす：学習ログアプリでの実践活用法

## はじめに：なぜ some と OR/AND が重要なのか

学習ログアプリの開発を進める中で、「特定のログを持つユニットを検索したい」「複数の条件を組み合わせて検索したい」といったニーズに直面しました。

これらの要求を実現するために、Prisma の **`some`** キーワードと **`OR/AND`** 演算子が非常に重要な役割を果たしています。本記事では、実際のアプリ開発での活用例を交えながら、これらの機能を詳しく解説します。

## 🎯 アプリのデータ構造（再確認）

まず、学習ログアプリのデータ構造を確認しましょう：

```prisma
model Unit {
  id      String   @id
  title   String
  status  Status
  displayFlag Boolean
  logs    Log[]    // ← Unit（1）: Log（多）
}

model Log {
  id     String   @id
  unit   Unit?    @relation(fields: [unitId], references: [id])
  unitId String?
  title  String
  note   String
}
```

## 🔍 Prisma の `some` キーワード：関連検索の基本

### some の基本概念

**`some`** は、リレーション先のモデル（多側）にある条件を課して、"元のモデル" をフィルタリングするために使います。

```typescript
const result = await prisma.unit.findMany({
  where: {
    logs: {
      some: {
        title: { contains: "React" },
      },
    },
  },
});
```

### 直感的な理解

🔍 **「リレーション先に こういう条件を満たすやつが 1個でもあったら、この親要素（元モデル）を結果に含めてね！」**

### 実際のアプリでの活用例

#### 例1: 「React」に関するログがあるユニットを検索

```typescript
// 「React」を含むログを持つユニットを取得
const unitsWithReactLogs = await prisma.unit.findMany({
  where: {
    logs: {
      some: {
        OR: [
          { title: { contains: "React", mode: "insensitive" } },
          { note: { contains: "React", mode: "insensitive" } },
        ],
      },
    },
  },
  include: {
    logs: true,
    _count: { select: { logs: true } },
  },
});
```

**結果**: ログのタイトルまたは内容に「React」を含むログが1つでもあるユニットがすべて取得されます。

#### 例2: 特定のタグを持つログがあるユニット

```typescript
// 「JavaScript」タグを持つログがあるユニットを検索
const unitsWithJSLogs = await prisma.unit.findMany({
  where: {
    logs: {
      some: {
        logTags: {
          some: {
            tag: {
              name: "JavaScript",
            },
          },
        },
      },
    },
  },
});
```

### some の仲間たち

```typescript
// 条件の種類
logs: {
  some: {
    title: {
      contains: "React";
    }
  } // 1件でも該当
}

logs: {
  every: {
    title: {
      contains: "React";
    }
  } // 全件が該当
}

logs: {
  none: {
    title: {
      contains: "React";
    }
  } // 1件も該当しない
}
```

#### 実用例：完了したユニットのみ

```typescript
// すべてのログが完了状態のユニットを取得
const completedUnits = await prisma.unit.findMany({
  where: {
    logs: {
      every: {
        status: "COMPLETED",
      },
    },
  },
});
```

## 🧠 OR/AND 演算子：複雑な検索条件の構築

### 基本構文

OR と AND は配列で複数の条件をまとめて記述します。これらは SQL の OR / AND に相当するロジカル演算です。

#### AND の例

```typescript
where: {
  AND: [{ status: "COMPLETED" }, { displayFlag: true }];
}
```

SQL で言うと：

```sql
WHERE status = 'COMPLETED' AND displayFlag = true
```

#### OR の例

```typescript
where: {
  OR: [
    { title: { contains: "React" } },
    { learningGoal: { contains: "Redux" } },
  ];
}
```

SQL で言うと：

```sql
WHERE title LIKE '%React%' OR learningGoal LIKE '%Redux%'
```

### 実際のアプリでの複合条件例

#### 例1: 公開済みで特定キーワードを含むユニット

```typescript
// 学習ログアプリの実際の検索処理
const searchUnits = await prisma.unit.findMany({
  where: {
    AND: [
      // 公開設定フィルター
      { displayFlag: true },

      // 検索キーワード条件
      {
        OR: [
          // ユニット自体の検索
          { title: { contains: query, mode: "insensitive" } },
          { learningGoal: { contains: query, mode: "insensitive" } },
          { reflection: { contains: query, mode: "insensitive" } },

          // ログ内容の検索（someと組み合わせ）
          {
            logs: {
              some: {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { note: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
    ],
  },
});
```

#### 例2: ステータスと作成者による絞り込み

```typescript
// 特定のユーザーの進行中または完了したユニット
const filteredUnits = await prisma.unit.findMany({
  where: {
    AND: [
      { userId: currentUserId },
      {
        OR: [{ status: "IN_PROGRESS" }, { status: "COMPLETED" }],
      },
    ],
  },
});
```

### ネスト構造の活用

```typescript
// より複雑な条件：公開済みで、特定キーワードを含み、かつ特定期間内
where: {
  AND: [
    { displayFlag: true },
    {
      OR: [
        { title: { contains: "React" } },
        { learningGoal: { contains: "Redux" } },
      ],
    },
    {
      createdAt: {
        gte: new Date("2024-01-01"),
        lte: new Date("2024-12-31"),
      },
    },
  ];
}
```

SQL 相当：

```sql
WHERE displayFlag = true
  AND (title LIKE '%React%' OR learningGoal LIKE '%Redux%')
  AND createdAt >= '2024-01-01'
  AND createdAt <= '2024-12-31'
```

## 🚀 実践的な組み合わせパターン

### パターン1: タグベースの検索

```typescript
// 特定のタグを持つユニットまたはログを検索
const taggedContent = await prisma.unit.findMany({
  where: {
    OR: [
      // ユニット自体にタグが付いている
      {
        unitTags: {
          some: {
            tag: { name: { in: ["React", "JavaScript"] } },
          },
        },
      },
      // ログにタグが付いている
      {
        logs: {
          some: {
            logTags: {
              some: {
                tag: { name: { in: ["React", "JavaScript"] } },
              },
            },
          },
        },
      },
    ],
  },
});
```

### パターン2: 学習進捗による分析

```typescript
// 学習が停滞しているユニットを特定
const stagnantUnits = await prisma.unit.findMany({
  where: {
    AND: [
      { status: "IN_PROGRESS" },
      {
        OR: [
          // ログが1つもない
          {
            logs: {
              none: {},
            },
          },
          // 最近ログが更新されていない
          {
            logs: {
              every: {
                updatedAt: {
                  lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日前
                },
              },
            },
          },
        ],
      },
    ],
  },
});
```

### パターン3: ユーザー権限による表示制御

```typescript
// 現在のユーザーが閲覧可能なユニット
const accessibleUnits = await prisma.unit.findMany({
  where: {
    OR: [
      // 公開ユニット
      { displayFlag: true },
      // 自分が作成したユニット
      {
        AND: [{ userId: currentUserId }, { displayFlag: false }],
      },
    ],
  },
});
```

## 💡 パフォーマンス最適化のコツ

### 1. インデックスの活用

```sql
-- some を使った検索でよく使われるカラムにインデックス
CREATE INDEX idx_logs_title ON logs(title);
CREATE INDEX idx_logs_unit_id ON logs(unit_id);
CREATE INDEX idx_units_display_flag ON units(display_flag);

-- 複合インデックス
CREATE INDEX idx_logs_unit_title ON logs(unit_id, title);
```

### 2. 条件の順序最適化

```typescript
// ❌ 重い条件を最初に
where: {
  AND: [
    {
      logs: {
        some: { title: { contains: query } },
      },
    },
    { displayFlag: true }, // 軽い条件を後に
  ];
}

// ✅ 軽い条件を最初に
where: {
  AND: [
    { displayFlag: true }, // 軽い条件を先に
    {
      logs: {
        some: { title: { contains: query } },
      },
    },
  ];
}
```

### 3. 必要なデータのみ取得

```typescript
// include で必要なリレーションのみ取得
const units = await prisma.unit.findMany({
  where: {
    /* 条件 */
  },
  select: {
    id: true,
    title: true,
    _count: {
      select: { logs: true },
    },
  },
});
```

## 🔧 実際の開発での失敗例と学び

### 失敗例1: 過度にネストした条件

```typescript
// ❌ 複雑すぎて可読性が悪い
where: {
  AND: [
    {
      OR: [
        {
          AND: [
            { status: "COMPLETED" },
            {
              logs: {
                some: {
                  OR: [
                    { title: { contains: "React" } },
                    { note: { contains: "React" } },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
  ];
}
```

**学び**: 複雑な条件は関数に分割して可読性を向上させる。

```typescript
// ✅ 関数に分割
const buildSearchCondition = (query: string) => ({
  OR: [
    { title: { contains: query, mode: "insensitive" } },
    { note: { contains: query, mode: "insensitive" } },
  ],
});

const buildLogSearchCondition = (query: string) => ({
  logs: {
    some: buildSearchCondition(query),
  },
});

// メインクエリ
where: {
  AND: [{ status: "COMPLETED" }, buildLogSearchCondition("React")];
}
```

### 失敗例2: N+1問題の発生

```typescript
// ❌ include を忘れてN+1問題発生
const units = await prisma.unit.findMany({
  where: {
    logs: { some: { title: { contains: "React" } } },
  },
});

// 後でログを取得（N+1問題）
for (const unit of units) {
  const logs = await prisma.log.findMany({
    where: { unitId: unit.id },
  });
}
```

```typescript
// ✅ include で一括取得
const units = await prisma.unit.findMany({
  where: {
    logs: { some: { title: { contains: "React" } } },
  },
  include: {
    logs: {
      where: { title: { contains: "React" } },
    },
  },
});
```

## 📊 まとめ：some と OR/AND の使い分け

### some の使いどころ

- **関連テーブルの条件でフィルタリング**したい時
- **「〜を持つ」系の検索**を実装したい時
- **親子関係のあるデータ**で子の条件から親を探したい時

### OR/AND の使いどころ

- **複数の検索条件**を組み合わせたい時
- **権限制御**で複雑な条件分岐が必要な時
- **フィルタリング機能**で柔軟な絞り込みを提供したい時

### 組み合わせの威力

`some` と `OR/AND` を組み合わせることで、非常に柔軟で強力な検索機能を実現できます。学習ログアプリでは、これらの機能により：

- ユニットとログを横断した検索
- 複雑な権限制御
- 高度なフィルタリング機能

を実現しています。

## 🚀 今後の活用予定

1. **全文検索との組み合わせ**: PostgreSQL の全文検索機能と組み合わせた高速検索
2. **集計クエリとの連携**: `some` を使った条件付き集計
3. **リアルタイム検索**: WebSocket と組み合わせた即座な検索結果更新

Prisma の `some` と `OR/AND` をマスターすることで、より柔軟で高機能なアプリケーションの開発が可能になります。ぜひ皆さんのプロジェクトでも活用してみてください！
