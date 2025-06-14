"use client";

import { useSupabaseAuthZustand } from "@/contexts/SupabaseAuthStore";
import { SWRProvider } from "@/lib/swr";

export function Providers({ children }: { children: React.ReactNode }) {
  useSupabaseAuthZustand(); // Zustand認証ストアの副作用初期化

  return <SWRProvider>{children}</SWRProvider>;
}
