"use client";

import { SWRProvider } from "@/lib/swr";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // アプリケーションの初回読み込み時に一度だけ認証状態の初期化と監視を開始する
    useAuthStore.getState().initializeAuth();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <SWRProvider>{children}</SWRProvider>
    </ThemeProvider>
  );
}
