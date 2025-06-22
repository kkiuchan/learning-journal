# Redux Toolkit の Middleware完全ガイド：getDefaultMiddleware から依存性注入まで

## 🚀 はじめに：なぜ Middleware を理解すべきなのか？

Redux Toolkit を使ったアプリケーション開発において、「なぜ非同期処理が動くのか？」「なぜ開発中に警告が表示されるのか？」といった疑問を持ったことはありませんか？

これらの機能を支えているのが **Middleware**（ミドルウェア）です。Middleware を理解することで：

- 🎯 非同期処理の仕組みが分かる
- 🛡️ 開発時のデバッグ機能を活用できる
- 🔧 依存性注入（DI）パターンが実装できる
- 📈 大規模アプリケーションの設計力が向上する

この記事では、Redux Toolkit の `configureStore` における `middleware` と `getDefaultMiddleware` について、基礎から実践まで詳しく解説します。

## 🔧 Middleware（ミドルウェア）とは？

### 基本概念

**Middleware = アクションとReducerの間に挟まる処理**

```
Action発生 → Middleware → Reducer → State更新
```

Middleware は、アクションが dispatch されてから Reducer に到達するまでの間で、様々な処理を行うことができます。

### 具体的な役割

- 🔄 非同期処理の制御
- 📝 ログ出力
- 🛡️ データの検証
- 🔒 認証チェック
- 📊 分析データの収集

## 📚 実例で理解する：Middleware なし vs あり

### ❌ Middleware なしの場合

```typescript
// Middleware を指定しない設定
const store = configureStore({
  reducer: {
    logs: logsReducer,
  },
  // middleware を指定しない → デフォルトのMiddlewareも無効
});

// ✅ 同期アクション：動作する
store.dispatch({ type: "logs/addLog", payload: newLog });

// ❌ 非同期処理：エラーが発生
store.dispatch(async (dispatch) => {
  const logs = await fetchLogs();
  dispatch({ type: "logs/setLogs", payload: logs });
});
// Error: Actions must be plain objects
```

### ✅ Middleware ありの場合

```typescript
// getDefaultMiddleware() でデフォルトのMiddlewareを有効化
const store = configureStore({
  reducer: {
    logs: logsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

// ✅ 同期処理：動作する
store.dispatch({ type: "logs/addLog", payload: newLog });

// ✅ 非同期処理：redux-thunk のおかげで動作する
store.dispatch(async (dispatch) => {
  const logs = await fetchLogs();
  dispatch({ type: "logs/setLogs", payload: logs });
});
```

## 🎛️ getDefaultMiddleware の正体

### Redux Toolkit が自動設定する Middleware

```typescript
// getDefaultMiddleware() が内部で設定するMiddleware
const defaultMiddleware = [
  "redux-thunk", // 非同期処理を可能にする
  "serializableCheck", // Stateの直列化可能性をチェック
  "immutableCheck", // Stateの不変性をチェック
  "actionCreatorCheck", // ActionCreatorの正しい使用をチェック
];
```

### 各 Middleware の詳細な役割

#### 1. **redux-thunk：非同期処理の心臓部**

```typescript
// redux-thunk により、関数をdispatchできる
const fetchLogs = () => async (dispatch: AppDispatch) => {
  dispatch({ type: "logs/setLoading", payload: true });

  try {
    const response = await api.getLogs();
    dispatch({ type: "logs/setLogs", payload: response.data });
  } catch (error) {
    dispatch({ type: "logs/setError", payload: error.message });
  } finally {
    dispatch({ type: "logs/setLoading", payload: false });
  }
};

// 関数をdispatch
store.dispatch(fetchLogs());
```

#### 2. **serializableCheck：データ品質のガード**

```typescript
// ❌ 直列化できないデータを検出
store.dispatch({
  type: "logs/addLog",
  payload: {
    id: 1,
    date: new Date(), // Date オブジェクト
    callback: () => {}, // 関数
    element: document.body, // DOM要素
  },
});
// Console: "A non-serializable value was detected in an action..."
```

**なぜ重要？**

- Redux の状態は JSON にシリアライズ可能である必要がある
- Time-travel debugging や状態の永続化が可能になる
- アプリケーションの予測可能性が向上する

#### 3. **immutableCheck：不変性のチェッカー**

```typescript
// ❌ Stateの直接変更を検出
const reducer = (state, action) => {
  switch (action.type) {
    case "logs/addLog":
      state.logs.push(action.payload); // 直接変更（NG）
      return state;
  }
};
// Console: "A non-serializable value was detected in the state..."
```

**正しい書き方：**

```typescript
const reducer = (state, action) => {
  switch (action.type) {
    case "logs/addLog":
      return {
        ...state,
        logs: [...state.logs, action.payload], // 不変更新
      };
  }
};
```

## 🛠️ Middleware のカスタマイズパターン

### パターン1：デフォルト設定

```typescript
const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});
```

### パターン2：デフォルト + 追加

```typescript
import logger from "redux-logger";

const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger), // デフォルト + logger
});
```

### パターン3：デフォルトの一部を無効化

```typescript
const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 直列化チェックを無効
      immutableCheck: false, // 不変性チェックを無効
    }),
});
```

### パターン4：完全カスタム

```typescript
import thunk from "redux-thunk";
import logger from "redux-logger";

const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: [thunk, logger], // デフォルトを使わず、完全カスタム
});
```

## 🎯 実践：依存性注入（DI）での活用

### 基本的な DI 設定

```typescript
const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: {
          // 👈 ここが依存性注入
          logRepository: new SupabaseLogRepository(),
          userRepository: new SupabaseUserRepository(),
        },
      },
    }),
});
```

### createAsyncThunk での受け取り

```typescript
export const fetchLogsByUnitId = createAsyncThunk<
  Log[],
  number,
  { extra: { logRepository: ILogRepository; userRepository: IUserRepository } }
>("logs/fetchByUnitId", async (unitId, { extra }) => {
  // 注入された依存関係を使用
  const logs = await extra.logRepository.findByUnitId(unitId);
  return logs;
});
```

### 高度な DI パターン

```typescript
// 環境別の依存関係設定
const createDependencies = (env: string) => {
  switch (env) {
    case "production":
      return {
        logRepository: new SupabaseLogRepository(),
        logger: new CloudLogger(),
        cache: new RedisCache(),
      };
    case "development":
      return {
        logRepository: new SupabaseLogRepository(),
        logger: new ConsoleLogger(),
        cache: new MemoryCache(),
      };
    case "test":
      return {
        logRepository: new MockLogRepository(),
        logger: new MockLogger(),
        cache: new MockCache(),
      };
  }
};

const dependencies = createDependencies(process.env.NODE_ENV);

const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: { extraArgument: dependencies },
    }),
});
```

## 🧪 環境別の最適化設定

### 開発環境：デバッグ重視

```typescript
const developmentStore = configureStore({
  reducer: {
    logs: logsReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // 開発時のチェックを有効化
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"], // 特定のアクションは除外
        warnAfter: 32, // パフォーマンス調整
      },
      immutableCheck: {
        warnAfter: 128,
      },
      thunk: {
        extraArgument: {
          logRepository: new SupabaseLogRepository(),
          logger: new ConsoleLogger({ level: "debug" }),
        },
      },
    }).concat(
      // 開発時のみ詳細ログを追加
      process.env.NODE_ENV === "development" ? [loggerMiddleware] : []
    ),
});
```

### 本番環境：パフォーマンス重視

```typescript
const productionStore = configureStore({
  reducer: {
    logs: logsReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // 本番では開発用チェックを無効化
      serializableCheck: false,
      immutableCheck: false,
      thunk: {
        extraArgument: {
          logRepository: new SupabaseLogRepository(),
          logger: new CloudLogger({ level: "error" }),
        },
      },
    }),
});
```

## 🔍 デバッグとモニタリング

### カスタムログ Middleware の実装

```typescript
const createLoggerMiddleware = (options = {}) => {
  return (store) => (next) => (action) => {
    const startTime = Date.now();

    console.group(`🚀 Action: ${action.type}`);
    console.log("📥 Previous State:", store.getState());
    console.log("📋 Action:", action);

    const result = next(action);

    console.log("📤 Next State:", store.getState());
    console.log(`⏱️ Duration: ${Date.now() - startTime}ms`);
    console.groupEnd();

    return result;
  };
};

const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(createLoggerMiddleware()),
});
```

### パフォーマンス監視 Middleware

```typescript
const performanceMiddleware = (store) => (next) => (action) => {
  const startTime = performance.now();
  const result = next(action);
  const endTime = performance.now();

  // 時間がかかりすぎた場合は警告
  if (endTime - startTime > 16) {
    // 16ms = 60fps
    console.warn(
      `⚠️ Slow action detected: ${action.type} took ${endTime - startTime}ms`
    );
  }

  return result;
};
```

## 📊 Middleware の実行順序

```typescript
const store = configureStore({
  reducer: { logs: logsReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware() // [thunk, serializableCheck, immutableCheck]
      .prepend(middlewareA) // 先頭に追加
      .concat(middlewareB), // 末尾に追加
});

// 実行順序: middlewareA → thunk → serializableCheck → immutableCheck → middlewareB
```

**重要なポイント：**

- 先に実行されるMiddlewareの結果が後続のMiddlewareに影響する
- `prepend()` で先頭に、`concat()` で末尾に追加
- 適切な順序で配置することが重要

## 🧪 テストでの活用

### テスト用のモック Middleware

```typescript
const createMockMiddleware = () => {
  const calls: any[] = [];

  const middleware = (store: any) => (next: any) => (action: any) => {
    calls.push({
      action,
      stateBefore: store.getState(),
      timestamp: Date.now(),
    });

    const result = next(action);

    calls.push({
      action,
      stateAfter: store.getState(),
      timestamp: Date.now(),
    });

    return result;
  };

  return { middleware, calls };
};

// テストでの使用例
describe("Redux Store", () => {
  it("should track middleware calls", () => {
    const { middleware, calls } = createMockMiddleware();

    const testStore = configureStore({
      reducer: { logs: logsReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(middleware),
    });

    testStore.dispatch({ type: "test", payload: "data" });

    expect(calls).toHaveLength(2); // before and after
    expect(calls[0].action.type).toBe("test");
  });
});
```

## 🎉 まとめ：Middleware マスターへの道

### 🔑 重要なポイント

1. **Middleware の役割**

   - アクションとReducerの間で処理を挟む仕組み
   - 非同期処理、ログ出力、バリデーションなどを担当

2. **getDefaultMiddleware の価値**

   - Redux Toolkit が推奨するMiddlewareを自動設定
   - 開発時のデバッグ支援機能が豊富
   - カスタマイズも柔軟に可能

3. **依存性注入の活用**
   - `extraArgument` でテスタブルな設計を実現
   - 環境別の設定や動的な切り替えが可能

### 💡 実用的な使い方テンプレート

```typescript
// 推奨設定テンプレート
const store = configureStore({
  reducer: {
    // あなたのreducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: dependencies, // DI
      },
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"], // 必要に応じて除外
      },
    }).concat(
      // 環境別の追加Middleware
      process.env.NODE_ENV === "development" ? [devMiddleware] : []
    ),
});
```

### 🚀 次のステップ

Redux Toolkit の Middleware を理解できたあなたは、次のような高度なパターンに挑戦できます：

- 🏗️ クリーンアーキテクチャとの組み合わせ
- 🔄 リアルタイム通信の統合
- 📊 分析データの自動収集
- 🧪 高度なテスト戦略の実装

**結論：** Middleware の理解により、Redux は単純な状態管理ツールから、非同期処理、DI、デバッグ機能を持つ**包括的なアプリケーション管理システム**に進化します。

---

_この記事が、あなたのRedux Toolkit習得の助けになれば幸いです。質問やフィードバックがあれば、お気軽にコメントしてください！_
