/**
 * @jest-environment jsdom
 */
import { expect } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useSyncedState } from "../useSyncedState";

describe("useSyncedState", () => {
  describe("初期値と基本動作", () => {
    it("初期値がそのまま返されること", () => {
      const { result } = renderHook(() => useSyncedState("初期値"));
      const [value, setValue] = result.current;

      expect(value).toBe("初期値");
      expect(typeof setValue).toBe("function");
    });

    it("数値でも正常に動作すること", () => {
      const { result } = renderHook(() => useSyncedState(42));
      const [value] = result.current;

      expect(value).toBe(42);
    });

    it("オブジェクトでも正常に動作すること", () => {
      const testObject = { name: "test", value: 123 };
      const { result } = renderHook(() => useSyncedState(testObject));
      const [value] = result.current;

      expect(value).toBe(testObject);
    });

    it("配列でも正常に動作すること", () => {
      const testArray = [1, 2, 3];
      const { result } = renderHook(() => useSyncedState(testArray));
      const [value] = result.current;

      expect(value).toBe(testArray);
    });

    it("null値でも正常に動作すること", () => {
      const { result } = renderHook(() => useSyncedState(null));
      const [value] = result.current;

      expect(value).toBeNull();
    });

    it("undefined値でも正常に動作すること", () => {
      const { result } = renderHook(() => useSyncedState(undefined));
      const [value] = result.current;

      expect(value).toBeUndefined();
    });
  });

  describe("外部値との同期", () => {
    it("外部値が変更されると内部状態も更新されること", () => {
      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: "初期値" } }
      );

      const [initialValue] = result.current;
      expect(initialValue).toBe("初期値");

      // 外部値を変更
      rerender({ externalValue: "新しい値" });

      const [updatedValue] = result.current;
      expect(updatedValue).toBe("新しい値");
    });

    it("複数回の外部値変更に対応すること", () => {
      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: 1 } }
      );

      expect(result.current[0]).toBe(1);

      rerender({ externalValue: 2 });
      expect(result.current[0]).toBe(2);

      rerender({ externalValue: 3 });
      expect(result.current[0]).toBe(3);

      rerender({ externalValue: 4 });
      expect(result.current[0]).toBe(4);
    });

    it("同じ値への変更でも正常に動作すること", () => {
      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: "test" } }
      );

      expect(result.current[0]).toBe("test");

      // 同じ値で再レンダリング
      rerender({ externalValue: "test" });
      expect(result.current[0]).toBe("test");
    });

    it("異なる型への変更でも正常に動作すること", () => {
      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: "string" as any } }
      );

      expect(result.current[0]).toBe("string");

      rerender({ externalValue: 123 as any });
      expect(result.current[0]).toBe(123);

      rerender({ externalValue: { obj: "value" } as any });
      expect(result.current[0]).toEqual({ obj: "value" });
    });
  });

  describe("内部setter機能", () => {
    it("setterで値を変更できること", () => {
      const { result } = renderHook(() => useSyncedState("初期値"));

      const [, setValue] = result.current;

      act(() => {
        setValue("変更後の値");
      });

      const [updatedValue] = result.current;
      expect(updatedValue).toBe("変更後の値");
    });

    it("setterで変更した後、外部値の変更で上書きされること", () => {
      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: "外部値" } }
      );

      // setterで内部値を変更
      const [, setValue] = result.current;
      act(() => {
        setValue("内部変更値");
      });

      expect(result.current[0]).toBe("内部変更値");

      // 外部値を変更すると上書きされる
      rerender({ externalValue: "新しい外部値" });
      expect(result.current[0]).toBe("新しい外部値");
    });

    it("setter関数の参照が一貫していること", () => {
      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: "test" } }
      );

      const [, initialSetValue] = result.current;

      // 外部値を変更
      rerender({ externalValue: "new test" });

      const [, updatedSetValue] = result.current;

      // setter関数は同じ参照を保持すべき
      expect(initialSetValue).toBe(updatedSetValue);
    });
  });

  describe("複雑なデータ型", () => {
    it("オブジェクトの同期が正常に動作すること", () => {
      const obj1 = { id: 1, name: "Object 1" };
      const obj2 = { id: 2, name: "Object 2" };

      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: obj1 } }
      );

      expect(result.current[0]).toBe(obj1);

      rerender({ externalValue: obj2 });
      expect(result.current[0]).toBe(obj2);
    });

    it("配列の同期が正常に動作すること", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ externalValue }) => useSyncedState(externalValue),
        { initialProps: { externalValue: arr1 } }
      );

      expect(result.current[0]).toBe(arr1);

      rerender({ externalValue: arr2 });
      expect(result.current[0]).toBe(arr2);
    });
  });
});
