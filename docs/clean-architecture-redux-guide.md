# Redux Toolkit で実現するクリーンアーキテクチャ：変化に強いフロントエンド設計

## 🚀 はじめに

現代のWebアプリケーション開発において、「変化に強い設計」は単なる理想ではなく、**ビジネスの成功を左右する重要な要素**です。

あなたがNext.jsアプリケーションを開発していて、こんな経験はありませんか？

- 「SupabaseからFirebaseに変更したいけど、影響範囲が大きすぎる...」
- 「新しいAPIエンドポイントに対応するために、あちこちのコンポーネントを修正している」
- 「テストを書きたいけど、データ取得ロジックがコンポーネントに直接埋め込まれていて難しい」

これらの問題を解決するのが、**Redux Toolkit × クリーンアーキテクチャ**の組み合わせです。

## 🏗️ クリーンアーキテクチャの核心思想

### 依存関係の逆転原理

クリーンアーキテクチャの最も重要な概念は「**依存関係の逆転**」です。

```
❌ 従来のアプローチ
UI → API → Database

✅ クリーンアーキテクチャ
UI → UseCase → Interface ← Repository → Database
```

**重要なポイント：**

- UIはユースケースに依存する
- ユースケースはインターフェースに依存する
- 実装（Repository）がインターフェースに依存する

### 4つの層の役割

```
┌─────────────────────────────────────────────────┐
│  🎨 Presentation Layer (UI)                     │
│  - Components, Pages, Hooks                     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  🎯 Application Layer (UseCases)                │
│  - Business Logic, Redux Slices                 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  🔌 Domain Layer (Interfaces)                   │
│  - Repository Interfaces, Domain Models         │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  🔧 Infrastructure Layer (Implementation)       │
│  - API Clients, Database Access                 │
└─────────────────────────────────────────────────┘
```

## 🛠️ Redux Toolkit との統合戦略

### 1. ディレクトリ構造

```
src/
├── features/
│   └── logs/
│       ├── domain/
│       │   ├── models/
│       │   │   └── Log.ts              # Domain Model
│       │   └── repositories/
│       │       └── ILogRepository.ts    # 🛡️ 守るべきファイル
│       ├── application/
│       │   ├── useCases/
│       │   │   └── fetchLogsByUnitId.ts # 🛡️ 守るべきファイル
│       │   └── store/
│       │       └── logsSlice.ts         # 🛡️ 守るべきファイル
│       ├── infrastructure/
│       │   └── repositories/
│       │       ├── supabaseLogRepository.ts  # 🔧 変更されるファイル
│       │       └── firebaseLogRepository.ts  # 🔧 変更されるファイル
│       └── presentation/
│           ├── components/
│           │   └── LogCard.tsx
│           └── hooks/
│               └── useLogActions.ts
└── shared/
    ├── store/
    │   └── index.ts                     # DI Container
    └── infrastructure/
        └── api/
            └── apiClient.ts
```

### 2. Domain Layer の設計

#### Domain Model

```typescript
// src/features/logs/domain/models/Log.ts
export interface Log {
  id: number;
  unitId: number;
  userId: string;
  title: string;
  note: string | null;
  learningTime: number | null;
  logDate: Date;
  effectScore: number | null;
  effectType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLogRequest {
  unitId: number;
  title: string;
  note?: string;
  learningTime?: number;
  logDate: Date;
  effectScore?: number;
  effectType?: string;
}
```

#### Repository Interface

```typescript
// src/features/logs/domain/repositories/ILogRepository.ts
import { Log, CreateLogRequest } from "../models/Log";

export interface ILogRepository {
  findByUnitId(unitId: number): Promise<Log[]>;
  findById(id: number): Promise<Log | null>;
  create(request: CreateLogRequest): Promise<Log>;
  update(id: number, request: Partial<CreateLogRequest>): Promise<Log>;
  delete(id: number): Promise<void>;
}

// 🛡️ このファイルは変更されない
// なぜなら、「何をするか」は変わらないから
```

### 3. Application Layer の実装

#### UseCase の実装

```typescript
// src/features/logs/application/useCases/fetchLogsByUnitId.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { ILogRepository } from "../../domain/repositories/ILogRepository";
import { Log } from "../../domain/models/Log";

export const fetchLogsByUnitId = createAsyncThunk<
  Log[],
  number,
  { extra: { logRepository: ILogRepository } }
>(
  "logs/fetchByUnitId",
  async (unitId: number, { extra: { logRepository } }) => {
    return await logRepository.findByUnitId(unitId);
  }
);

export const createLog = createAsyncThunk<
  Log,
  CreateLogRequest,
  { extra: { logRepository: ILogRepository } }
>(
  "logs/create",
  async (request: CreateLogRequest, { extra: { logRepository } }) => {
    return await logRepository.create(request);
  }
);

// 🛡️ このファイルも変更されない
// ビジネスの意図（「ログを取得する」）は変わらないから
```

#### Redux Slice の実装

```typescript
// src/features/logs/application/store/logsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Log } from "../../domain/models/Log";
import { fetchLogsByUnitId, createLog } from "../useCases/fetchLogsByUnitId";

interface LogsState {
  logs: Log[];
  loading: boolean;
  error: string | null;
}

const initialState: LogsState = {
  logs: [],
  loading: false,
  error: null,
};

const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 取得
      .addCase(fetchLogsByUnitId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogsByUnitId.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchLogsByUnitId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch logs";
      })
      // 作成
      .addCase(createLog.fulfilled, (state, action) => {
        state.logs.push(action.payload);
      });
  },
});

export const { clearError } = logsSlice.actions;
export default logsSlice.reducer;

// 🛡️ このファイルは基本的に変更されない
// アプリケーションの状態構造は安定しているべき
```

### 4. Infrastructure Layer の実装

#### Supabase Repository Implementation

```typescript
// src/features/logs/infrastructure/repositories/supabaseLogRepository.ts
import { ILogRepository } from "../../domain/repositories/ILogRepository";
import { Log, CreateLogRequest } from "../../domain/models/Log";
import { supabase } from "@/lib/supabaseClient";

export class SupabaseLogRepository implements ILogRepository {
  async findByUnitId(unitId: number): Promise<Log[]> {
    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .eq("unit_id", unitId)
      .order("log_date", { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(this.toDomain);
  }

  async create(request: CreateLogRequest): Promise<Log> {
    const { data, error } = await supabase
      .from("logs")
      .insert([this.toInfrastructure(request)])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return this.toDomain(data);
  }

  private toDomain(data: any): Log {
    return {
      id: data.id,
      unitId: data.unit_id,
      userId: data.user_id,
      title: data.title,
      note: data.note,
      learningTime: data.learning_time,
      logDate: new Date(data.log_date),
      effectScore: data.effect_score,
      effectType: data.effect_type,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private toInfrastructure(domain: CreateLogRequest): any {
    return {
      unit_id: domain.unitId,
      title: domain.title,
      note: domain.note,
      learning_time: domain.learningTime,
      log_date: domain.logDate.toISOString(),
      effect_score: domain.effectScore,
      effect_type: domain.effectType,
    };
  }
}

// 🔧 このファイルは変更される
// 技術的な都合（APIの変更、DB構造の変更）で頻繁に更新される
```

#### Firebase Repository Implementation

```typescript
// src/features/logs/infrastructure/repositories/firebaseLogRepository.ts
import { ILogRepository } from "../../domain/repositories/ILogRepository";
import { Log, CreateLogRequest } from "../../domain/models/Log";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export class FirebaseLogRepository implements ILogRepository {
  async findByUnitId(unitId: number): Promise<Log[]> {
    const q = query(
      collection(db, "logs"),
      where("unitId", "==", unitId),
      orderBy("logDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Log
    );
  }

  async create(request: CreateLogRequest): Promise<Log> {
    const docRef = await addDoc(collection(db, "logs"), {
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Log;
  }
}

// 🔧 異なる実装だが、同じインターフェースを満たす
// Supabase → Firebase の切り替えがここだけで完了
```

### 5. Store Configuration（依存注入）

```typescript
// src/shared/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import logsReducer from "@/features/logs/application/store/logsSlice";
import { ILogRepository } from "@/features/logs/domain/repositories/ILogRepository";
import { SupabaseLogRepository } from "@/features/logs/infrastructure/repositories/supabaseLogRepository";
// import { FirebaseLogRepository } from '@/features/logs/infrastructure/repositories/firebaseLogRepository';

// 🔄 依存注入のポイント
const logRepository: ILogRepository = new SupabaseLogRepository();
// const logRepository: ILogRepository = new FirebaseLogRepository(); // 切り替えはここだけ

export const store = configureStore({
  reducer: {
    logs: logsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: {
          logRepository, // UseCaseで使用される
        },
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ⚙️ このファイルは設定変更のたびに更新される
// しかし、構造的には非常にシンプル
```

### 6. Presentation Layer での使用

```typescript
// src/features/logs/presentation/hooks/useLogActions.ts
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import {
  fetchLogsByUnitId,
  createLog,
} from "../../application/useCases/fetchLogsByUnitId";
import { clearError } from "../../application/store/logsSlice";

export const useLogActions = () => {
  const dispatch = useAppDispatch();
  const { logs, loading, error } = useAppSelector((state) => state.logs);

  return {
    logs,
    loading,
    error,
    fetchLogs: (unitId: number) => dispatch(fetchLogsByUnitId(unitId)),
    createLog: (request: CreateLogRequest) => dispatch(createLog(request)),
    clearError: () => dispatch(clearError()),
  };
};
```

```typescript
// src/features/logs/presentation/components/LogsSection.tsx
import { useLogActions } from "../hooks/useLogActions";

export const LogsSection: React.FC<{ unitId: number }> = ({ unitId }) => {
  const { logs, loading, error, fetchLogs, createLog } = useLogActions();

  useEffect(() => {
    fetchLogs(unitId);
  }, [unitId]);

  // UI implementation...
};
```

## 📊 従来のアプローチとの比較

### SWR + Direct API Calls

```typescript
// ❌ 従来のアプローチ
const { data: logs } = useSWR(`/api/units/${unitId}/logs`, fetcher);

// 問題点：
// - APIエンドポイントが変わると全て修正が必要
// - モック化が困難
// - ビジネスロジックが散在
```

### Redux Toolkit + Clean Architecture

```typescript
// ✅ クリーンアーキテクチャ
const { logs } = useLogActions();

// メリット：
// - 実装の変更がUIに影響しない
// - テストが容易
// - ビジネスロジックが集約されている
```

## 🎯 実装の恩恵

### 1. **技術負債の削減**

- データソースの変更時の影響範囲が限定される
- 新機能追加時の予測可能性が向上

### 2. **テスタビリティの向上**

```typescript
// UseCaseのテスト例
const mockRepository: ILogRepository = {
  findByUnitId: jest.fn().mockResolvedValue([mockLog]),
  // ...
};

// Repositoryをモック化してテスト可能
```

### 3. **チーム開発の効率化**

- インターフェースが決まれば並行開発可能
- 責任範囲が明確

## 📈 段階的移行戦略

### Phase 1: Repository Interface の定義

1. `ILogRepository.ts` の作成
2. 現在のAPIクライアントをRepository実装に変換

### Phase 2: UseCase層の導入

1. `createAsyncThunk` ベースのユースケース作成
2. 既存のSWRフックを段階的に置き換え

### Phase 3: 完全移行

1. 全てのデータアクセスをRepository経由に変更
2. SWRの依存関係を削除

## 🎉 まとめ

Redux Toolkit × クリーンアーキテクチャの組み合わせは、以下を実現します：

**🛡️ 変化に強い設計**

- 外部の変更（API、DB）が内部に影響しない
- 新しい要求に柔軟に対応可能

**🧪 テストしやすい構造**

- 依存関係の注入によりモック化が容易
- 単体テストから統合テストまで網羅可能

**👥 チーム開発の最適化**

- インターフェースによる明確な契約
- 並行開発とコードレビューの効率化

**📚 学習コストの投資価値**

- 初期コストはあるものの、長期的な保守性が飛躍的に向上
- 他のプロジェクトにも応用可能な普遍的パターン

クリーンアーキテクチャは「理想論」ではなく、**実践的な解決策**です。あなたのプロジェクトの成長と共に、この設計パターンがどれほど価値を発揮するかを実感していただけるはずです。

---

_この記事が、あなたのフロントエンド設計における新たな視点となれば幸いです。質問やフィードバックがございましたら、お気軽にコメントください！_
