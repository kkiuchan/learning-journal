"use client";

import { SWRProvider } from "@/lib/swr";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRProvider>{children}</SWRProvider>
    </SessionProvider>
  );
}
