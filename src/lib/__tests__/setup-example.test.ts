// セットアップ/クリーンアップの実践例

describe("📚 セットアップ/クリーンアップ", () => {
  // テスト用のデータ
  let users: Array<{ id: number; name: string; email: string }>;
  let currentId: number;

  // 🚀 各テストの前に実行される
  beforeEach(() => {
    console.log("🔧 テストの準備中...");
    users = [];
    currentId = 1;
  });

  // 🧹 各テストの後に実行される
  afterEach(() => {
    console.log("🧹 テストの後片付け中...");
    users = [];
  });

  // 📝 テストスイート全体の最初に1回だけ実行
  beforeAll(() => {
    console.log("🎬 テストスイート開始！");
  });

  // 🏁 テストスイート全体の最後に1回だけ実行
  afterAll(() => {
    console.log("🎉 テストスイート完了！");
  });

  test("ユーザーを作成できる", () => {
    const user = createUser("田中太郎", "tanaka@example.com");

    expect(user.id).toBe(1);
    expect(user.name).toBe("田中太郎");
    expect(users).toHaveLength(1);
  });

  test("複数ユーザーを作成できる", () => {
    createUser("佐藤花子", "sato@example.com");
    createUser("山田一郎", "yamada@example.com");

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe("佐藤花子");
    expect(users[1].name).toBe("山田一郎");
  });

  test("同じメールアドレスは使えない", () => {
    createUser("テスト1", "test@example.com");

    expect(() => {
      createUser("テスト2", "test@example.com");
    }).toThrow("メールアドレスが重複しています");
  });

  // ヘルパー関数
  function createUser(name: string, email: string) {
    // 既存メールチェック
    if (users.some((u) => u.email === email)) {
      throw new Error("メールアドレスが重複しています");
    }

    const user = {
      id: currentId++,
      name,
      email,
    };

    users.push(user);
    return user;
  }
});

describe("🎯 実際のプロジェクト例", () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // LocalStorageのモック
    mockLocalStorage = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
    });
  });

  test("ユーザー設定を保存できる", () => {
    const settings = { theme: "dark", language: "ja" };

    // 設定を保存
    localStorage.setItem("userSettings", JSON.stringify(settings));

    // 確認
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "userSettings",
      JSON.stringify(settings)
    );

    // 読み込み確認
    const saved = localStorage.getItem("userSettings");
    expect(JSON.parse(saved!)).toEqual(settings);
  });
});
