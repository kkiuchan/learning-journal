import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import
    /**
     * 📚 Jest Mock関数 実践ガイド
     * 学習ジャーナルプロジェクトでの使用例
     */
    // テスト対象の関数群
    class LogService {
        constructor(private apiClient: any) { }

        async createLog(data: any) {
            const result = await this.apiClient.post("/api/logs", data);
            return result.data;
        }

        async uploadFile(file: File) {
            const formData = new FormData();
            formData.append("file", file);
            return await this.apiClient.post("/api/upload", formData);
        }
    };

class NotificationService {
  showToast(message: string, type: "success" | "error" = "success") {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  async sendEmail(to: string, subject: string) {
    // 実際のメール送信ロジック
    return { success: true, messageId: "12345" };
  }
}

// ユーティリティ関数
function validateLogData(data: any): boolean {
  return data.title && data.content && data.learningTime > 0;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

describe("🔥 jest.fn() - 基本のモック関数", () => {
  test("1. 空のモック関数", () => {
    const mockFn = jest.fn();

    // 関数を呼び出し
    mockFn();
    mockFn("引数1", "引数2");

    // 呼び出し回数を検証
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenNthCalledWith(2, "引数1", "引数2");
  });

  test("2. 戻り値を設定したモック", () => {
    const mockValidate = jest.fn().mockReturnValue(true);

    const result = mockValidate({ title: "テスト" });

    expect(result).toBe(true);
    expect(mockValidate).toHaveBeenCalledWith({ title: "テスト" });
  });

  test("3. 非同期モック関数", async () => {
    const mockApiCall = jest.fn().mockResolvedValue({
      id: 1,
      title: "学習ログ",
      status: "success",
    });

    const result = await mockApiCall("/api/logs");

    expect(result).toEqual({
      id: 1,
      title: "学習ログ",
      status: "success",
    });
  });

  test("4. エラーを投げるモック", async () => {
    const mockApiCall = jest
      .fn()
      .mockRejectedValue(new Error("ネットワークエラー"));

    await expect(mockApiCall()).rejects.toThrow("ネットワークエラー");
  });
});

describe("🕵️ jest.spyOn() - メソッドの監視", () => {
  test("1. コンソールログのスパイ", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const notification = new NotificationService();
    notification.showToast("テストメッセージ", "success");

    expect(consoleSpy).toHaveBeenCalledWith("[SUCCESS] テストメッセージ");

    consoleSpy.mockRestore(); // 元に戻す
  });

  test("2. Dateオブジェクトのモック", () => {
    const mockDate = new Date("2023-12-25");
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    const formatted = formatDate(new Date());

    expect(formatted).toBe("2023-12-25");
  });

  test("3. 外部APIクライアントのスパイ", async () => {
    const mockApiClient = {
      post: jest.fn().mockResolvedValue({ data: { id: 123 } }),
    };

    const logService = new LogService(mockApiClient);
    const result = await logService.createLog({
      title: "Jest学習",
      content: "Mock関数について学習中",
    });

    expect(mockApiClient.post).toHaveBeenCalledWith("/api/logs", {
      title: "Jest学習",
      content: "Mock関数について学習中",
    });
    expect(result).toEqual({ id: 123 });
  });
});

describe("🔄 モック関数の高度な使い方", () => {
  test("1. 複数回の呼び出しで異なる戻り値", () => {
    const mockFn = jest
      .fn()
      .mockReturnValueOnce("1回目")
      .mockReturnValueOnce("2回目")
      .mockReturnValue("デフォルト");

    expect(mockFn()).toBe("1回目");
    expect(mockFn()).toBe("2回目");
    expect(mockFn()).toBe("デフォルト");
    expect(mockFn()).toBe("デフォルト"); // 以降はデフォルト
  });

  test("2. カスタム実装を持つモック", () => {
    const mockCalculate = jest
      .fn()
      .mockImplementation((a: number, b: number) => {
        return a * b + 10; // カスタムロジック
      });

    expect(mockCalculate(2, 3)).toBe(16); // 2*3+10
    expect(mockCalculate).toHaveBeenCalledWith(2, 3);
  });

  test("3. 部分的なモックオブジェクト", () => {
    const mockUser = {
      id: 1,
      name: "テストユーザー",
      save: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    };

    mockUser.save();
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.name).toBe("テストユーザー"); // 通常のプロパティ
  });
});

describe("🔍 モック関数の検証パターン", () => {
  let mockFn: jest.Mock;

  beforeEach(() => {
    mockFn = jest.fn();
  });

  test("1. 基本的な呼び出し検証", () => {
    mockFn("arg1", "arg2");

    // 呼び出されたか
    expect(mockFn).toHaveBeenCalled();

    // 特定の引数で呼び出されたか
    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");

    // 呼び出し回数
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test("2. 複数回呼び出しの検証", () => {
    mockFn("first");
    mockFn("second");
    mockFn("third");

    // N回目の呼び出しを検証
    expect(mockFn).toHaveBeenNthCalledWith(1, "first");
    expect(mockFn).toHaveBeenNthCalledWith(2, "second");
    expect(mockFn).toHaveBeenLastCalledWith("third");
  });

  test("3. 引数の詳細検証", () => {
    const complexObject = {
      user: { id: 1, name: "テスト" },
      metadata: { timestamp: expect.any(Number) },
    };

    mockFn(complexObject);

    expect(mockFn).toHaveBeenCalledWith({
      user: { id: 1, name: "テスト" },
      metadata: { timestamp: expect.any(Number) },
    });
  });
});

describe("🎭 実際のユースケース", () => {
  test("ファイルアップロード機能のテスト", async () => {
    // Fileオブジェクトのモック
    const mockFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });

    const mockApiClient = {
      post: jest.fn().mockResolvedValue({
        data: { url: "https://example.com/test.txt" },
      }),
    };

    const logService = new LogService(mockApiClient);
    const result = await logService.uploadFile(mockFile);

    // FormDataが正しく作られているか検証
    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/api/upload",
      expect.any(FormData)
    );
  });

  test("ファイルアップロード機能のテスト", async () => {
    const mockFile = new File([]);
  });

  test("エラーハンドリングのテスト", async () => {
    const mockApiClient = {
      post: jest.fn().mockRejectedValue(new Error("API Error")),
    };

    const logService = new LogService(mockApiClient);

    await expect(logService.createLog({ title: "test" })).rejects.toThrow(
      "API Error"
    );
  });

  test("条件分岐のテスト", () => {
    // バリデーション関数をモック
    const mockValidate = jest
      .fn()
      .mockReturnValueOnce(true) // 1回目：成功
      .mockReturnValueOnce(false); // 2回目：失敗

    // 成功ケース
    let result = mockValidate({ title: "valid", learningTime: 30 });
    expect(result).toBe(true);

    // 失敗ケース
    result = mockValidate({ title: "", learningTime: 0 });
    expect(result).toBe(false);

    expect(mockValidate).toHaveBeenCalledTimes(2);
  });
});
