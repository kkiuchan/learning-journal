"use client";

import { supabase } from "@/lib/supabase-auth";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        console.log("[SupabaseAuth] Getting initial session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("[SupabaseAuth] Initial session result:", {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          userId: session?.user?.id || "none",
          userEmail: session?.user?.email || "none",
        });

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error("[SupabaseAuth] Initial session fetch error:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態変更の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log(`[SupabaseAuth] Auth state changed: ${event}`, {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          userId: session?.user?.id || "none",
          userEmail: session?.user?.email || "none",
        });

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error(
      "useSupabaseAuth must be used within a SupabaseAuthProvider"
    );
  }
  return context;
}
