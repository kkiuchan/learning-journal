import { useMemo, useRef } from "react";

interface ToggleableItem {
  id: number;
}

/**
 * メニューのトグル機能を提供するカスタムフック
 *
 * @param items - トグル対象のアイテム配列
 * @param currentOpenId - 現在開いているアイテムのID
 * @param setOpenId - 開いているアイテムのIDを設定する関数
 * @returns 各アイテムのトグル関数のマップ
 */
export function useMenuToggle<T extends ToggleableItem>(
  items: T[],
  currentOpenId: number | null,
  setOpenId: (id: number | null) => void
) {
  // 現在の開いているIDを参照で保持（依存関係を排除）
  const currentOpenIdRef = useRef(currentOpenId);
  currentOpenIdRef.current = currentOpenId;

  // 各アイテムのトグル関数を安定して生成
  const toggleFunctions = useMemo(() => {
    const functions: Record<number, () => void> = {};

    items.forEach((item) => {
      functions[item.id] = () => {
        const currentOpen = currentOpenIdRef.current;
        const newId = currentOpen === item.id ? null : item.id;
        setOpenId(newId);
      };
    });

    return functions;
  }, [items, setOpenId]);

  return toggleFunctions;
}

/**
 * より汎用的なバージョン（カスタムキー関数対応）
 */
export function useGenericMenuToggle<T>(
  items: T[],
  getKey: (item: T) => string | number,
  currentOpenKey: string | number | null,
  setOpenKey: (key: string | number | null) => void
) {
  const currentOpenKeyRef = useRef(currentOpenKey);
  currentOpenKeyRef.current = currentOpenKey;

  const toggleFunctions = useMemo(() => {
    const functions: Record<string | number, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      functions[key] = () => {
        const currentOpen = currentOpenKeyRef.current;
        const newKey = currentOpen === key ? null : key;
        setOpenKey(newKey);
      };
    });

    return functions;
  }, [items, getKey, setOpenKey]);

  return toggleFunctions;
}
