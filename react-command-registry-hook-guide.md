# React カスタムフック完全ガイド：useCommandRegistry で大量の状態管理を効率化

React開発において、複数の要素に対して個別の状態管理とトグル機能を実装する場面は頻繁に発生します。ツールバーのボタン、設定パネルのスイッチ、フィルター条件の切り替えなど、「大量の要素それぞれに ON/OFF 状態を持たせたい」というケースです。

この記事では、`useMemo`と`useRef`を組み合わせた高度なカスタムフック`useCommandRegistry`を通じて、効率的で安全な状態管理手法を詳しく解説します。

---

## 🎯 useCommandRegistry フックの全体像

### 基本実装

```typescript
function useCommandRegistry<T>(items: T[], getKey: (item: T) => string) {
  const stateRef = useRef<Record<string, boolean>>({});

  const registry = useMemo(() => {
    const commands: Record<string, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      stateRef.current[key] = false;

      commands[key] = () => {
        stateRef.current[key] = !stateRef.current[key];
        console.log(`${key} is now`, stateRef.current[key]);
      };
    });

    return commands;
  }, [items, getKey]);

  return registry;
}
```

### フックの役割

**このフックは「キーごとに状態を持って、それをトグルするコマンド関数のセットを生成する」ものです。**

- 🔑 **キーベース管理**: 各アイテムを一意のキーで識別
- 🔄 **トグル機能**: ON/OFF状態の切り替え
- 📦 **一括生成**: 大量のコマンド関数を効率的に作成
- 🚀 **パフォーマンス最適化**: 安定した関数参照

---

## 🔄 データの流れ：完全解説

### ステップ1: フック呼び出し

```typescript
const commands = useCommandRegistry(items, getKey);
```

### ステップ2: useRef による状態管理の初期化

```typescript
const stateRef = useRef<Record<string, boolean>>({});
```

**重要なポイント:**

- `stateRef.current`は`{}`からスタート
- 各itemのキーに対応する状態（boolean）を保持
- `useRef`なので状態変更時に再レンダリングが発生しない

### ステップ3: useMemo による関数群の生成

依存配列`[items, getKey]`に変化があると以下の処理を実行：

#### 3-1. commands オブジェクトの初期化

```typescript
const commands: Record<string, () => void> = {};
```

#### 3-2. 各itemに対する処理ループ

```typescript
items.forEach((item) => {
  const key = getKey(item); // キーを取り出す
  stateRef.current[key] = false; // 状態をfalseで初期化

  commands[key] = () => {
    stateRef.current[key] = !stateRef.current[key]; // 状態を反転
    console.log(`${key} is now`, stateRef.current[key]); // ログ出力
  };
});
```

### ステップ4: 実際のデータ変換例

```typescript
// 入力データ
const items = [{ id: "a" }, { id: "b" }];
const getKey = (item) => item.id;

// 結果
stateRef.current = { a: false, b: false };

commands = {
  a: () => {
    stateRef.current.a = !stateRef.current.a;
  },
  b: () => {
    stateRef.current.b = !stateRef.current.b;
  },
};
```

### ステップ5: 関数の実行例

```typescript
const commands = useCommandRegistry(
  [{ id: "a" }, { id: "b" }],
  (item) => item.id
);

// 初期状態
stateRef.current = { a: false, b: false };

// 実際の操作
commands["a"](); // stateRef.current.a → true  (ログ: "a is now true")
commands["a"](); // stateRef.current.a → false (ログ: "a is now false")
commands["b"](); // stateRef.current.b → true  (ログ: "b is now true")
```

---

## 🛠️ 実践的な使用例

### 例1: ツールバーコンポーネント

```typescript
import React from "react";

interface CommandItem {
  id: string;
  label: string;
  icon: string;
}

const toolbarItems: CommandItem[] = [
  { id: "bold", label: "Bold", icon: "B" },
  { id: "italic", label: "Italic", icon: "I" },
  { id: "underline", label: "Underline", icon: "U" },
  { id: "strikethrough", label: "Strike", icon: "S" },
];

export default function ToolbarPanel() {
  // useCommandRegistry を使って各コマンドのトグル関数を取得
  const commands = useCommandRegistry(toolbarItems, (item) => item.id);

  return (
    <div className="toolbar">
      <h2>Text Formatting Toolbar</h2>
      <div className="button-group">
        {toolbarItems.map((item) => (
          <button
            key={item.id}
            onClick={commands[item.id]}
            className="toolbar-button"
            title={item.label}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 例2: フィルター設定パネル

```typescript
interface FilterOption {
  id: string;
  label: string;
  category: string;
}

const filterOptions: FilterOption[] = [
  { id: "new", label: "新着", category: "time" },
  { id: "popular", label: "人気", category: "ranking" },
  { id: "free", label: "無料", category: "price" },
  { id: "premium", label: "プレミアム", category: "price" },
];

export function FilterPanel() {
  const filterCommands = useCommandRegistry(filterOptions, (option) => option.id);

  return (
    <div className="filter-panel">
      <h3>フィルター設定</h3>
      {filterOptions.map((option) => (
        <label key={option.id} className="filter-option">
          <input
            type="checkbox"
            onChange={filterCommands[option.id]}
          />
          <span>{option.label}</span>
          <small>({option.category})</small>
        </label>
      ))}
    </div>
  );
}
```

### 例3: 設定管理システム

```typescript
interface SettingItem {
  key: string;
  label: string;
  description: string;
}

const settingItems: SettingItem[] = [
  { key: "notifications", label: "通知", description: "プッシュ通知を受け取る" },
  { key: "darkMode", label: "ダークモード", description: "ダークテーマを使用" },
  { key: "autoSave", label: "自動保存", description: "編集内容を自動保存" },
  { key: "analytics", label: "分析", description: "使用状況の分析を許可" },
];

export function SettingsPanel() {
  const settingCommands = useCommandRegistry(settingItems, (item) => item.key);

  return (
    <div className="settings-panel">
      <h2>アプリケーション設定</h2>
      {settingItems.map((item) => (
        <div key={item.key} className="setting-item">
          <div className="setting-info">
            <h4>{item.label}</h4>
            <p>{item.description}</p>
          </div>
          <button
            onClick={settingCommands[item.key]}
            className="toggle-button"
          >
            切り替え
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## ⚡ パフォーマンスの利点

### 従来のアプローチの問題点

```typescript
// ❌ 問題のあるパターン
function BadToolbar({ items }) {
  const [states, setStates] = useState({});

  return (
    <div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            // 毎回新しい関数が作られる
            setStates(prev => ({
              ...prev,
              [item.id]: !prev[item.id]
            }));
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

### useCommandRegistry の利点

```typescript
// ✅ 最適化されたパターン
function OptimizedToolbar({ items }) {
  const commands = useCommandRegistry(items, item => item.id);

  return (
    <div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={commands[item.id]} // 安定した関数参照
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

**パフォーマンス改善点:**

- 🚀 **関数の安定性**: `useMemo`により関数参照が安定
- 🔄 **再レンダリング削減**: `useRef`により不要な再レンダリングを防止
- 📦 **メモリ効率**: 関数の重複生成を避ける

---

## 🔧 発展的な使用パターン

### パターン1: UI状態との連携

```typescript
function useCommandRegistryWithUI<T>(items: T[], getKey: (item: T) => string) {
  const stateRef = useRef<Record<string, boolean>>({});
  const [uiState, setUiState] = useState<Record<string, boolean>>({});

  const registry = useMemo(() => {
    const commands: Record<string, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      stateRef.current[key] = false;

      commands[key] = () => {
        stateRef.current[key] = !stateRef.current[key];

        // UI状態も更新
        setUiState((prev) => ({
          ...prev,
          [key]: stateRef.current[key],
        }));

        console.log(`${key} is now`, stateRef.current[key]);
      };
    });

    return commands;
  }, [items, getKey]);

  return { registry, uiState };
}
```

### パターン2: コールバック付きバージョン

```typescript
function useCommandRegistryWithCallback<T>(
  items: T[],
  getKey: (item: T) => string,
  onToggle?: (key: string, newValue: boolean) => void
) {
  const stateRef = useRef<Record<string, boolean>>({});

  const registry = useMemo(() => {
    const commands: Record<string, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      stateRef.current[key] = false;

      commands[key] = () => {
        stateRef.current[key] = !stateRef.current[key];

        // コールバック実行
        onToggle?.(key, stateRef.current[key]);

        console.log(`${key} is now`, stateRef.current[key]);
      };
    });

    return commands;
  }, [items, getKey, onToggle]);

  return registry;
}

// 使用例
const commands = useCommandRegistryWithCallback(
  items,
  (item) => item.id,
  (key, value) => {
    // 状態変更時の処理
    saveSettingToServer(key, value);
  }
);
```

### パターン3: 初期値設定対応

```typescript
function useCommandRegistryWithDefaults<T>(
  items: T[],
  getKey: (item: T) => string,
  getDefaultValue: (item: T) => boolean = () => false
) {
  const stateRef = useRef<Record<string, boolean>>({});

  const registry = useMemo(() => {
    const commands: Record<string, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      stateRef.current[key] = getDefaultValue(item); // 初期値を設定

      commands[key] = () => {
        stateRef.current[key] = !stateRef.current[key];
        console.log(`${key} is now`, stateRef.current[key]);
      };
    });

    return commands;
  }, [items, getKey, getDefaultValue]);

  return registry;
}

// 使用例
const commands = useCommandRegistryWithDefaults(
  settings,
  (setting) => setting.id,
  (setting) => setting.defaultEnabled // 初期値を個別設定
);
```

---

## ⚠️ 注意点と制限事項

### 1. UI更新について

```typescript
// ❌ 注意：UI状態は自動更新されない
const commands = useCommandRegistry(items, (item) => item.id);

// stateRef.current の変更はUIに反映されない
commands["item1"](); // 内部状態は変わるが、画面は更新されない
```

### 2. 状態の永続化

```typescript
// ❌ 注意：コンポーネント再マウント時に状態がリセット
useEffect(() => {
  // コンポーネントが再マウントされると stateRef.current は {} にリセット
}, []);
```

### 3. デバッグの複雑さ

```typescript
// デバッグ用のヘルパー関数
function useCommandRegistryWithDebug<T>(
  items: T[],
  getKey: (item: T) => string
) {
  const stateRef = useRef<Record<string, boolean>>({});

  // デバッグ用：現在の状態を取得する関数
  const getState = useCallback(() => {
    return { ...stateRef.current };
  }, []);

  const registry = useMemo(() => {
    const commands: Record<string, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      stateRef.current[key] = false;

      commands[key] = () => {
        const oldValue = stateRef.current[key];
        stateRef.current[key] = !oldValue;

        console.log(`🔄 ${key}: ${oldValue} → ${stateRef.current[key]}`);
        console.log("📊 全状態:", getState());
      };
    });

    return commands;
  }, [items, getKey, getState]);

  return { registry, getState };
}
```

---

## 🎯 最適な使用場面

### ✅ useCommandRegistry が適している場面

1. **大量の要素に対する個別状態管理**

   ```typescript
   // 例：100個のフィルターオプション
   const filterCommands = useCommandRegistry(
     filterOptions,
     (option) => option.id
   );
   ```

2. **再レンダリングを伴わないロジック制御**

   ```typescript
   // 例：地図のレイヤー表示/非表示
   const layerCommands = useCommandRegistry(mapLayers, (layer) => layer.id);
   ```

3. **安定した関数セットをpropsに渡したい場合**

   ```typescript
   // 子コンポーネントに安定した関数を渡す
   <ChildComponent onToggle={commands[item.id]} />
   ```

4. **imperativeな操作が中心の場合**
   ```typescript
   // 例：音声プレイヤーの制御
   const audioCommands = useCommandRegistry(audioTracks, (track) => track.id);
   ```

### ❌ 他のアプローチが適している場面

1. **UI状態との密接な連携が必要**

   ```typescript
   // useState の方が適している
   const [isVisible, setIsVisible] = useState(false);
   ```

2. **単純な状態管理**

   ```typescript
   // 過度な最適化は不要
   const [selectedId, setSelectedId] = useState(null);
   ```

3. **状態の永続化が必要**
   ```typescript
   // Redux や Zustand などの状態管理ライブラリが適している
   ```

---

## 🚀 実装のベストプラクティス

### 1. 型安全性の確保

```typescript
interface CommandItem {
  id: string;
  [key: string]: any;
}

function useTypedCommandRegistry<T extends CommandItem>(
  items: T[],
  getKey: (item: T) => string = (item) => item.id
) {
  // 型安全な実装
}
```

### 2. エラーハンドリング

```typescript
function useCommandRegistryWithErrorHandling<T>(
  items: T[],
  getKey: (item: T) => string
) {
  const stateRef = useRef<Record<string, boolean>>({});

  const registry = useMemo(() => {
    const commands: Record<string, () => void> = {};

    items.forEach((item) => {
      try {
        const key = getKey(item);
        if (typeof key !== "string" || key.trim() === "") {
          console.warn("Invalid key for item:", item);
          return;
        }

        stateRef.current[key] = false;
        commands[key] = () => {
          stateRef.current[key] = !stateRef.current[key];
          console.log(`${key} is now`, stateRef.current[key]);
        };
      } catch (error) {
        console.error("Error processing item:", item, error);
      }
    });

    return commands;
  }, [items, getKey]);

  return registry;
}
```

### 3. テスタビリティの向上

```typescript
// テスト用のヘルパー
export function createTestCommandRegistry<T>(
  items: T[],
  getKey: (item: T) => string
) {
  const stateRef = { current: {} as Record<string, boolean> };
  const commands: Record<string, () => void> = {};

  items.forEach((item) => {
    const key = getKey(item);
    stateRef.current[key] = false;
    commands[key] = () => {
      stateRef.current[key] = !stateRef.current[key];
    };
  });

  return { commands, stateRef };
}

// テスト例
describe("useCommandRegistry", () => {
  it("should toggle state correctly", () => {
    const { commands, stateRef } = createTestCommandRegistry(
      [{ id: "test" }],
      (item) => item.id
    );

    expect(stateRef.current.test).toBe(false);
    commands.test();
    expect(stateRef.current.test).toBe(true);
  });
});
```

---

## 📝 まとめ

`useCommandRegistry`フックは、`useMemo`と`useRef`を巧妙に組み合わせることで、以下の利点を実現します：

### 🎯 主要な利点

1. **効率的な状態管理**: 大量の要素に対する個別状態を効率的に管理
2. **パフォーマンス最適化**: 安定した関数参照により不要な再レンダリングを防止
3. **スケーラビリティ**: アイテム数の増加に対して柔軟に対応
4. **メモリ効率**: 関数の重複生成を避けてメモリ使用量を最適化

### 🛠️ 適用場面

- **ツールバー**: 複数のフォーマット機能の ON/OFF 管理
- **フィルターパネル**: 多数の検索条件の状態管理
- **設定画面**: アプリケーション設定の一括管理
- **地図アプリ**: レイヤー表示の制御
- **音楽プレイヤー**: トラックの再生状態管理

### ⚡ 技術的なポイント

- `useRef`による再レンダリング回避
- `useMemo`による関数の安定化
- 型安全性とエラーハンドリングの重要性
- UI状態との連携パターン

このフックは、React の状態管理において「大量の個別状態を効率的に扱う」という特定の問題を解決する強力なツールです。適切な場面で使用することで、アプリケーションのパフォーマンスと保守性を大幅に向上させることができます。

---

**次のステップ**: 実際のプロジェクトでこのパターンを試し、UI状態との連携や永続化など、要件に応じてカスタマイズしてみてください 🚀
