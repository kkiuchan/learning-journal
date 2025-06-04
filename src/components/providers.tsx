"use client";

import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { SWRProvider } from "@/lib/swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <SWRProvider>{children}</SWRProvider>
    </SupabaseAuthProvider>
  );
}
