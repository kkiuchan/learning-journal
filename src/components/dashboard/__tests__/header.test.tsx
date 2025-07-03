import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DashboardHeader } from "../header";

// モックを定義
jest.mock("@/stores/SupabaseAuthStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("@/stores/ModalStore", () => ({
  useModalStore: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// テスト用のimport
import { useModalStore } from "@/stores/ModalStore";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { useRouter } from "next/navigation";

// Mock関数の型定義
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseModalStore = useModalStore as jest.MockedFunction<
  typeof useModalStore
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("DashboardHeader", () => {
  const mockPush = jest.fn();
  const mockOpenCreateUnitModal = jest.fn();

  beforeEach(() => {
    // 各テスト前にモックをクリア
    jest.clearAllMocks();

    // デフォルトのモック設定
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });

    mockUseModalStore.mockReturnValue({
      openCreateUnitModal: mockOpenCreateUnitModal,
    });
  });

  test("ローディング状態が正しく表示される", () => {
    mockUseAuthStore.mockReturnValue({
      session: null,
      loading: true,
    });

    render(<DashboardHeader />);

    // ローディング中はスピナーが表示される
    const spinner = document.querySelector("svg");
    expect(spinner).toBeTruthy();
  });

  test("認証済みユーザーのヘッダーが表示される", () => {
    mockUseAuthStore.mockReturnValue({
      session: {
        user: { id: "test-user-id" },
      },
      loading: false,
    });

    render(<DashboardHeader />);

    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(
      screen.getByText("あなたの学習進捗状況と最近の活動を確認できます。")
    ).toBeInTheDocument();
    expect(screen.getByText("新規ユニット")).toBeInTheDocument();
    expect(screen.getByText("プロフィール")).toBeInTheDocument();
  });

  test("新規ユニットボタンがモーダルを開く", () => {
    mockUseAuthStore.mockReturnValue({
      session: {
        user: { id: "test-user-id" },
      },
      loading: false,
    });

    render(<DashboardHeader />);

    const createButton = screen.getByText("新規ユニット");
    fireEvent.click(createButton);

    expect(mockOpenCreateUnitModal).toHaveBeenCalledTimes(1);
  });

  test("プロフィールボタンがナビゲーションを実行する", async () => {
    mockUseAuthStore.mockReturnValue({
      session: {
        user: { id: "test-user-id" },
      },
      loading: false,
    });

    render(<DashboardHeader />);

    const profileButton = screen.getByText("プロフィール");
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/users/test-user-id");
    });
  });

  test("ユーザーIDがない場合プロフィールボタンが非表示", () => {
    mockUseAuthStore.mockReturnValue({
      session: {
        user: { id: null },
      },
      loading: false,
    });

    render(<DashboardHeader />);

    expect(screen.queryByText("プロフィール")).not.toBeInTheDocument();
  });

  test("セッションがない場合プロフィールボタンが非表示", () => {
    mockUseAuthStore.mockReturnValue({
      session: null,
      loading: false,
    });

    render(<DashboardHeader />);

    expect(screen.queryByText("プロフィール")).not.toBeInTheDocument();
  });

  test("ナビゲーション中のローディング状態", async () => {
    mockUseAuthStore.mockReturnValue({
      session: {
        user: { id: "test-user-id" },
      },
      loading: false,
    });

    // プロミスを制御するためのモック
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });

    mockPush.mockImplementation(() => promise);

    render(<DashboardHeader />);

    const profileButton = screen.getByText("プロフィール");
    fireEvent.click(profileButton);

    // ローディング状態を確認
    await waitFor(() => {
      expect(profileButton).toBeDisabled();
    });

    // プロミスを解決
    resolvePromise!();

    await waitFor(() => {
      expect(profileButton).not.toBeDisabled();
    });
  });

  test("ナビゲーションエラーが適切に処理される", async () => {
    mockUseAuthStore.mockReturnValue({
      session: {
        user: { id: "test-user-id" },
      },
      loading: false,
    });

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = new Error("Navigation failed");
    mockPush.mockRejectedValue(error);

    render(<DashboardHeader />);

    const profileButton = screen.getByText("プロフィール");
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Navigation error:", error);
    });

    consoleErrorSpy.mockRestore();
  });

  test("適切なクラスとアイコンが表示される", () => {
    mockUseAuthStore.mockReturnValue({
      session: {
        user: { id: "test-user-id" },
      },
      loading: false,
    });

    render(<DashboardHeader />);

    // アイコンが表示されることを確認
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(2); // book + user アイコン
  });
});
