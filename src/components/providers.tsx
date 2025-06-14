"use client";

import { SWRProvider } from "@/lib/swr";
import { useSupabaseAuthZustand } from "@/hooks/useSupabaseAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  useSupabaseAuthZustand(); // Zustand認証ストアの副作用初期化

  return <SWRProvider>{children}</SWRProvider>;
}
