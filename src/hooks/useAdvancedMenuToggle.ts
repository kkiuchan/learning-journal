import { useCallback, useMemo, useRef } from "react";

interface AdvancedMenuToggleOptions {
  /** 複数同時オープンを許可するか */
  allowMultiple?: boolean;
  /** 自動クローズのタイマー（ms） */
  autoCloseDelay?: number;
  /** 開閉時のコールバック */
  onToggle?: (id: string | number, isOpen: boolean) => void;
}

/**
 * 高機能なメニュートグルフック
 * - 複数同時オープン対応
 * - 自動クローズ機能
 * - コールバック対応
 */
export function useAdvancedMenuToggle<T>(
  items: T[],
  getKey: (item: T) => string | number,
  currentOpenKeys: (string | number)[] | string | number | null,
  setOpenKeys: (keys: (string | number)[] | string | number | null) => void,
  options: AdvancedMenuToggleOptions = {}
) {
  const { allowMultiple = false, autoCloseDelay, onToggle } = options;

  const currentOpenKeysRef = useRef(currentOpenKeys);
  currentOpenKeysRef.current = currentOpenKeys;

  const autoCloseTimersRef = useRef<Map<string | number, NodeJS.Timeout>>(
    new Map()
  );

  // 正規化されたオープンキーのセットを取得
  const normalizeOpenKeys = useCallback(
    (keys: typeof currentOpenKeys): Set<string | number> => {
      if (keys === null) return new Set();
      if (Array.isArray(keys)) return new Set(keys);
      return new Set([keys]);
    },
    []
  );

  // 自動クローズタイマーの設定
  const setAutoCloseTimer = useCallback(
    (key: string | number) => {
      if (!autoCloseDelay) return;

      // 既存のタイマーをクリア
      const existingTimer = autoCloseTimersRef.current.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      // 新しいタイマーを設定
      const timer = setTimeout(() => {
        const currentOpen = normalizeOpenKeys(currentOpenKeysRef.current);
        if (currentOpen.has(key)) {
          const newOpen = new Set(currentOpen);
          newOpen.delete(key);

          if (allowMultiple) {
            setOpenKeys(Array.from(newOpen));
          } else {
            setOpenKeys(null);
          }

          onToggle?.(key, false);
        }
        autoCloseTimersRef.current.delete(key);
      }, autoCloseDelay);

      autoCloseTimersRef.current.set(key, timer);
    },
    [autoCloseDelay, allowMultiple, setOpenKeys, onToggle, normalizeOpenKeys]
  );

  const toggleFunctions = useMemo(() => {
    const functions: Record<string | number, () => void> = {};

    items.forEach((item) => {
      const key = getKey(item);
      functions[key] = () => {
        const currentOpen = normalizeOpenKeys(currentOpenKeysRef.current);
        const isCurrentlyOpen = currentOpen.has(key);

        if (allowMultiple) {
          // 複数同時オープンモード
          const newOpen = new Set(currentOpen);
          if (isCurrentlyOpen) {
            newOpen.delete(key);
            // タイマーをクリア
            const timer = autoCloseTimersRef.current.get(key);
            if (timer) {
              clearTimeout(timer);
              autoCloseTimersRef.current.delete(key);
            }
          } else {
            newOpen.add(key);
            setAutoCloseTimer(key);
          }
          setOpenKeys(Array.from(newOpen));
        } else {
          // 単一オープンモード
          if (isCurrentlyOpen) {
            setOpenKeys(null);
            // タイマーをクリア
            const timer = autoCloseTimersRef.current.get(key);
            if (timer) {
              clearTimeout(timer);
              autoCloseTimersRef.current.delete(key);
            }
          } else {
            // 全てのタイマーをクリア
            autoCloseTimersRef.current.forEach((timer) => clearTimeout(timer));
            autoCloseTimersRef.current.clear();

            setOpenKeys(key);
            setAutoCloseTimer(key);
          }
        }

        onToggle?.(key, !isCurrentlyOpen);
      };
    });

    return functions;
  }, [
    items,
    getKey,
    allowMultiple,
    setOpenKeys,
    setAutoCloseTimer,
    onToggle,
    normalizeOpenKeys,
  ]);

  // クリーンアップ関数
  const cleanup = useCallback(() => {
    autoCloseTimersRef.current.forEach((timer) => clearTimeout(timer));
    autoCloseTimersRef.current.clear();
  }, []);

  return { toggleFunctions, cleanup };
}
