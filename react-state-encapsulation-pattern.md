# React 状態カプセル化パターン：useRef + コマンド関数で実現するクリーンなAPI設計

Reactにおいて「状態は隠して、操作手段だけを提供したい」という場面は頻繁に発生します。この記事では、`useRef`を活用した状態カプセル化パターンを通じて、よりクリーンで保守性の高いカスタムフックの設計手法を解説します。

---

## 🎯 基本パターン：状態カプセル化 + コマンド提供

### 核となる実装

```typescript
function useToggleRegistry<T>(items: T[], getKey: (item: T) => string) {
  // 🔑 内部状態：外部には公開しない
  const stateRef = useRef<Record<string, boolean>>({});

  const commands = useMemo(() => {
    const registry: Record<string, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      stateRef.current[key] = false; // 初期化

      // 🎯 操作関数のみを提供
      registry[key] = () => {
        stateRef.current[key] = !stateRef.current[key];
        console.log(`Toggled ${key}:`, stateRef.current[key]);
      };
    });

    return registry;
  }, [items, getKey]);

  return commands; // 状態ではなく、関数のみを返す
}
```

### 使用例

```typescript
function MenuComponent() {
  const menuItems = [
    { id: 'file', label: 'ファイル' },
    { id: 'edit', label: '編集' },
    { id: 'view', label: '表示' }
  ];

  const toggleMap = useToggleRegistry(menuItems, (item) => item.id);

  return (
    <div>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={toggleMap[item.id]} // シンプルな関数呼び出し
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

---

## 🚀 このパターンの3つのメリット

### 1️⃣ **状態カプセル化**

```typescript
// ❌ 状態が外部に漏れるパターン
const { states, setStates, toggleItem } = useBadToggle();
// 外部から states を直接操作できてしまう

// ✅ 状態を隠蔽するパターン
const commands = useToggleRegistry(items, getKey);
// 外部は関数経由でのみ操作可能
```

### 2️⃣ **再レンダリング抑制**

```typescript
// useRef の更新は再レンダリングを引き起こさない
stateRef.current[key] = !stateRef.current[key]; // 再レンダリングなし

// useMemo で安定した関数参照を提供
const commands = useMemo(() => {
  // 関数が安定しているため、子コンポーネントの不要な再レンダリングを防ぐ
}, [items, getKey]);
```

### 3️⃣ **責務の明確化**

- **カスタムフック**: ロジック管理（状態保持 + 操作提供）
- **コンポーネント**: UI表示と操作呼び出しのみ

---

## 🛠️ 実用的な応用例

### アコーディオンメニュー

```typescript
function useAccordion(sections: Section[]) {
  const openStateRef = useRef<Record<string, boolean>>({});

  const accordionControls = useMemo(() => {
    const controls: Record<string, () => void> = {};

    sections.forEach((section) => {
      openStateRef.current[section.id] = false;

      controls[section.id] = () => {
        // 他のセクションを閉じる（単一展開）
        Object.keys(openStateRef.current).forEach(key => {
          openStateRef.current[key] = key === section.id ?
            !openStateRef.current[key] : false;
        });

        // 必要に応じてコールバック実行
        section.onToggle?.(openStateRef.current[section.id]);
      };
    });

    return controls;
  }, [sections]);

  return accordionControls;
}

// 使用例
function AccordionComponent() {
  const sections = [
    { id: 'basic', title: '基本設定', onToggle: (open) => console.log('Basic:', open) },
    { id: 'advanced', title: '詳細設定', onToggle: (open) => console.log('Advanced:', open) }
  ];

  const controls = useAccordion(sections);

  return (
    <div>
      {sections.map((section) => (
        <div key={section.id}>
          <button onClick={controls[section.id]}>
            {section.title}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### フィルター管理

```typescript
function useFilterRegistry(filters: FilterOption[]) {
  const activeFiltersRef = useRef<Record<string, boolean>>({});

  const filterCommands = useMemo(() => {
    const commands: Record<string, () => void> = {};

    filters.forEach((filter) => {
      activeFiltersRef.current[filter.id] = filter.defaultActive || false;

      commands[filter.id] = () => {
        activeFiltersRef.current[filter.id] =
          !activeFiltersRef.current[filter.id];

        // フィルター変更の副作用を実行
        const activeFilters = Object.entries(activeFiltersRef.current)
          .filter(([_, active]) => active)
          .map(([id]) => id);

        filter.onChange?.(activeFilters);
      };
    });

    return commands;
  }, [filters]);

  return filterCommands;
}
```

---

## 🔧 応用テクニック

### 状態の読み取りを可能にする場合

```typescript
function useToggleRegistryWithReader<T>(
  items: T[],
  getKey: (item: T) => string
) {
  const stateRef = useRef<Record<string, boolean>>({});

  const commands = useMemo(() => {
    // ... 基本実装
  }, [items, getKey]);

  const getState = useCallback((key: string) => {
    return stateRef.current[key] || false;
  }, []);

  const getAllStates = useCallback(() => {
    return { ...stateRef.current };
  }, []);

  return {
    commands,
    getState, // 個別状態の取得
    getAllStates, // 全状態の取得
  };
}
```

### UI状態との連携が必要な場合

```typescript
function useToggleWithUI<T>(items: T[], getKey: (item: T) => string) {
  const stateRef = useRef<Record<string, boolean>>({});
  const [uiState, setUiState] = useState<Record<string, boolean>>({});

  const commands = useMemo(() => {
    const registry: Record<string, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      stateRef.current[key] = false;

      registry[key] = () => {
        stateRef.current[key] = !stateRef.current[key];

        // UI状態も同期
        setUiState((prev) => ({
          ...prev,
          [key]: stateRef.current[key],
        }));
      };
    });

    return registry;
  }, [items, getKey]);

  return { commands, uiState };
}
```

---

## 🎯 使用すべき場面

### ✅ このパターンが適している場面

1. **非表示の状態制御**

   ```typescript
   // 例：メニューの開閉、モーダルの表示状態など
   const menuControls = useToggleRegistry(menuItems, (item) => item.id);
   ```

2. **Reactの状態として持ちたくない場合**

   ```typescript
   // 例：頻繁に変わるが再レンダリングは不要な状態
   const debugControls = useToggleRegistry(debugOptions, (opt) => opt.key);
   ```

3. **ステートレスなAPIに近いインターフェース**
   ```typescript
   // 例：設定の有効/無効切り替え
   const settingControls = useToggleRegistry(settings, (s) => s.name);
   ```

### ❌ 他のアプローチが適している場面

1. **UI表示に直接関わる状態**

   ```typescript
   // useState の方が適している
   const [isVisible, setIsVisible] = useState(false);
   ```

2. **状態の履歴や複雑な更新が必要**
   ```typescript
   // useReducer や状態管理ライブラリが適している
   const [state, dispatch] = useReducer(reducer, initialState);
   ```

---

## 📝 まとめ

### 🔑 核となる概念

**「状態は隠して、操作手段だけを提供する」**

このパターンにより以下を実現：

- **🔒 カプセル化**: 内部状態を外部から直接操作されるリスクを回避
- **⚡ パフォーマンス**: 不要な再レンダリングを防止
- **🎯 シンプルなAPI**: 使う側は関数を呼ぶだけ
- **🛡️ 保守性**: 内部実装の変更が外部に影響しない

### 🚀 実践のポイント

1. **適切な抽象化**: 必要な操作のみを外部に公開
2. **一貫性のあるAPI**: 命名規則と使用パターンを統一
3. **副作用の管理**: 状態変更時の追加処理を適切に実装

この状態カプセル化パターンは、Reactの柔軟性を活かした実用的な設計手法です。適切な場面で活用することで、よりクリーンで保守しやすいコードを実現できます。

---

**次のステップ**: 実際のプロジェクトでこのパターンを試し、チーム内でのAPI設計の指針として活用してみてください 🎯
