"use client";

import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { ReactNode, useEffect } from "react";

/**
 * アプリケーション全体で認証状態を初期化・監視するためのプロバイダーコンポーネント
 */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // アプリケーションの初回読み込み時に一度だけ認証状態の初期化と監視を開始する
    useAuthStore.getState().initializeAuth();
  }, []);

  return <>{children}</>;
}
