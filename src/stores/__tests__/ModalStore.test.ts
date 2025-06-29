/**
 * @jest-environment jsdom
 */
import { expect } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useModalStore } from "../ModalStore";

describe("ModalStore", () => {
  // 各テストの前にストアの状態をリセット
  beforeEach(() => {
    useModalStore.setState({
      isCreateUnitModalOpen: false,
    });
  });

  describe("初期状態", () => {
    it("isCreateUnitModalOpenの初期値はfalseであること", () => {
      const { result } = renderHook(() => useModalStore());
      expect(result.current.isCreateUnitModalOpen).toBe(false);
    });

    it("必要な関数が全て定義されていること", () => {
      const { result } = renderHook(() => useModalStore());
      expect(typeof result.current.openCreateUnitModal).toBe("function");
      expect(typeof result.current.closeCreateUnitModal).toBe("function");
      expect(typeof result.current.setIsCreateUnitModalOpen).toBe("function");
    });
  });

  describe("openCreateUnitModal", () => {
    it("モーダルを開くことができること", () => {
      const { result } = renderHook(() => useModalStore());

      // 初期状態では閉じている
      expect(result.current.isCreateUnitModalOpen).toBe(false);

      // モーダルを開く
      act(() => {
        result.current.openCreateUnitModal();
      });

      expect(result.current.isCreateUnitModalOpen).toBe(true);
    });
  });

  describe("closeCreateUnitModal", () => {
    it("モーダルを閉じることができること", () => {
      const { result } = renderHook(() => useModalStore());

      // 最初にモーダルを開く
      act(() => {
        result.current.openCreateUnitModal();
      });
      expect(result.current.isCreateUnitModalOpen).toBe(true);

      // モーダルを閉じる
      act(() => {
        result.current.closeCreateUnitModal();
      });

      expect(result.current.isCreateUnitModalOpen).toBe(false);
    });
  });

  describe("setIsCreateUnitModalOpen", () => {
    it("trueを設定してモーダルを開くことができること", () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.setIsCreateUnitModalOpen(true);
      });

      expect(result.current.isCreateUnitModalOpen).toBe(true);
    });

    it("falseを設定してモーダルを閉じることができること", () => {
      const { result } = renderHook(() => useModalStore());

      // 最初にモーダルを開く
      act(() => {
        result.current.setIsCreateUnitModalOpen(true);
      });
      expect(result.current.isCreateUnitModalOpen).toBe(true);

      // モーダルを閉じる
      act(() => {
        result.current.setIsCreateUnitModalOpen(false);
      });

      expect(result.current.isCreateUnitModalOpen).toBe(false);
    });
  });

  describe("状態変化のパターン", () => {
    it("開く→閉じる→開くの連続操作が正しく動作すること", () => {
      const { result } = renderHook(() => useModalStore());

      // 1回目：開く
      act(() => {
        result.current.openCreateUnitModal();
      });
      expect(result.current.isCreateUnitModalOpen).toBe(true);

      // 1回目：閉じる
      act(() => {
        result.current.closeCreateUnitModal();
      });
      expect(result.current.isCreateUnitModalOpen).toBe(false);

      // 2回目：開く
      act(() => {
        result.current.openCreateUnitModal();
      });
      expect(result.current.isCreateUnitModalOpen).toBe(true);
    });

    it("異なる方法で開閉操作を組み合わせても正しく動作すること", () => {
      const { result } = renderHook(() => useModalStore());

      // setIsCreateUnitModalOpenで開く
      act(() => {
        result.current.setIsCreateUnitModalOpen(true);
      });
      expect(result.current.isCreateUnitModalOpen).toBe(true);

      // closeCreateUnitModalで閉じる
      act(() => {
        result.current.closeCreateUnitModal();
      });
      expect(result.current.isCreateUnitModalOpen).toBe(false);

      // openCreateUnitModalで開く
      act(() => {
        result.current.openCreateUnitModal();
      });
      expect(result.current.isCreateUnitModalOpen).toBe(true);

      // setIsCreateUnitModalOpenで閉じる
      act(() => {
        result.current.setIsCreateUnitModalOpen(false);
      });
      expect(result.current.isCreateUnitModalOpen).toBe(false);
    });
  });
});
