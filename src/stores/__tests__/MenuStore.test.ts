/**
 * @jest-environment jsdom
 */
import { expect } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useMenuStore } from "../MenuStore";

describe("MenuStore", () => {
  // 各テストの前にストアの状態をリセット
  beforeEach(() => {
    useMenuStore.setState({ openMenuId: null });
  });

  describe("初期状態", () => {
    it("openMenuIdの初期値はnullであること", () => {
      const { result } = renderHook(() => useMenuStore());
      expect(result.current.openMenuId).toBeNull();
    });

    it("必要な関数が定義されていること", () => {
      const { result } = renderHook(() => useMenuStore());
      expect(typeof result.current.setOpenMenuId).toBe("function");
    });
  });

  describe("setOpenMenuId", () => {
    it("メニューIDを設定できること", () => {
      const { result } = renderHook(() => useMenuStore());

      act(() => {
        result.current.setOpenMenuId(1);
      });

      expect(result.current.openMenuId).toBe(1);
    });

    it("異なるメニューIDに変更できること", () => {
      const { result } = renderHook(() => useMenuStore());

      // 最初にメニューID 1を設定
      act(() => {
        result.current.setOpenMenuId(1);
      });
      expect(result.current.openMenuId).toBe(1);

      // メニューID 2に変更
      act(() => {
        result.current.setOpenMenuId(2);
      });
      expect(result.current.openMenuId).toBe(2);
    });

    it("nullを設定してメニューを閉じることができること", () => {
      const { result } = renderHook(() => useMenuStore());

      // 最初にメニューを開く
      act(() => {
        result.current.setOpenMenuId(1);
      });
      expect(result.current.openMenuId).toBe(1);

      // メニューを閉じる
      act(() => {
        result.current.setOpenMenuId(null);
      });
      expect(result.current.openMenuId).toBeNull();
    });
  });

  describe("複数コンポーネントでの状態共有", () => {
    it("複数のフックで同じ状態を共有すること", () => {
      const { result: hook1 } = renderHook(() => useMenuStore());
      const { result: hook2 } = renderHook(() => useMenuStore());

      // 初期状態では両方nullであること
      expect(hook1.current.openMenuId).toBeNull();
      expect(hook2.current.openMenuId).toBeNull();

      // 一方で状態を変更
      act(() => {
        hook1.current.setOpenMenuId(5);
      });

      // 両方のフックで状態が更新されること
      expect(hook1.current.openMenuId).toBe(5);
      expect(hook2.current.openMenuId).toBe(5);
    });
  });
});
