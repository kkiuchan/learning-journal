/**
 * @jest-environment jsdom
 */
import { expect } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "../useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    // 各テストの前にフェイクタイマーを有効化
    jest.useFakeTimers();
  });

  afterEach(() => {
    // 各テストの後にフェイクタイマーを無効化
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("初期値と基本動作", () => {
    it("初期値がそのまま返されること", () => {
      const { result } = renderHook(() => useDebouncedValue("初期値", 1000));

      expect(result.current).toBe("初期値");
    });

    it("数値でも正常に動作すること", () => {
      const { result } = renderHook(() => useDebouncedValue(42, 500));

      expect(result.current).toBe(42);
    });

    it("オブジェクトでも正常に動作すること", () => {
      const testObject = { name: "test", value: 123 };
      const { result } = renderHook(() => useDebouncedValue(testObject, 500));

      expect(result.current).toBe(testObject);
    });
  });

  describe("遅延実行（debounce）機能", () => {
    it("値が変更されても遅延時間内は古い値が返されること", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: "初期値", delay: 1000 } }
      );

      expect(result.current).toBe("初期値");

      // 値を変更
      rerender({ value: "新しい値", delay: 1000 });

      // まだタイマーが進んでいないので古い値のまま
      expect(result.current).toBe("初期値");
    });

    it("遅延時間が経過すると新しい値が返されること", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: "初期値", delay: 1000 } }
      );

      expect(result.current).toBe("初期値");

      // 値を変更
      rerender({ value: "新しい値", delay: 1000 });
      expect(result.current).toBe("初期値");

      // タイマーを進める
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current).toBe("新しい値");
    });

    it("複数回の変更があっても最後の値のみが反映されること", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: "初期値", delay: 1000 } }
      );

      // 短時間で複数回変更
      rerender({ value: "変更1", delay: 1000 });
      rerender({ value: "変更2", delay: 1000 });
      rerender({ value: "最終値", delay: 1000 });

      // まだ古い値のまま
      expect(result.current).toBe("初期値");

      // タイマーを進める
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 最後の値のみ反映される
      expect(result.current).toBe("最終値");
    });
  });

  describe("異なる遅延時間での動作", () => {
    it("短い遅延時間でも正常に動作すること", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: "初期値", delay: 100 } }
      );

      rerender({ value: "新しい値", delay: 100 });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe("新しい値");
    });

    it("遅延時間が途中で変更されても動作すること", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: "初期値", delay: 1000 } }
      );

      // 値と遅延時間を同時に変更
      rerender({ value: "新しい値", delay: 500 });

      // 新しい遅延時間で動作確認
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe("新しい値");
    });
  });

  describe("タイマーのクリーンアップ", () => {
    it("値が変更される前にタイマーがクリーンアップされること", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: "初期値", delay: 1000 } }
      );

      // 最初の変更
      rerender({ value: "変更1", delay: 1000 });

      // 途中で時間を進める（完全には進めない）
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // 別の値に変更（前のタイマーがキャンセルされる）
      rerender({ value: "変更2", delay: 1000 });

      // 最初のタイマーの残り時間を進める
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // まだ「変更1」は反映されず、古い値のまま
      expect(result.current).toBe("初期値");

      // 新しいタイマーを完了させる
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 「変更2」が反映される
      expect(result.current).toBe("変更2");
    });
  });
});
