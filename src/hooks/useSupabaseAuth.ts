"use client";

import { supabase } from "@/lib/supabase-auth";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "./useAuth";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  primaryAuthMethod?: string;
}

/**
 * @deprecated このフックは非推奨です。
 * 代わりに @/contexts/SupabaseAuthStore を使用してください。
 *
 * このフックは将来のバージョンで削除される予定です。
 */
export function useSupabaseAuth(requireAuth: boolean = true) {
  console.warn(
    "[DEPRECATED] useSupabaseAuth hook from @/hooks/useSupabaseAuth is deprecated. " +
      "Please use useSupabaseAuth from @/contexts/SupabaseAuthContext instead."
  );

  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);

        if (session?.user) {
          // データベースからユーザー情報を取得
          const response = await fetch("/api/auth/user");
          if (response.ok) {
            const userData = await response.json();
            setAuthUser(userData.user);
          }
        }
      } catch (error) {
        console.error("Failed to get initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // データベースからユーザー情報を取得
          try {
            const response = await fetch("/api/auth/user");
            if (response.ok) {
              const userData = await response.json();
              setAuthUser(userData.user);
            }
          } catch (error) {
            console.error("Failed to get user data:", error);
          }
        } else {
          setAuthUser(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      router.push("/auth/supabase-login");
    }
  }, [user, loading, requireAuth, router]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
      router.push("/auth/supabase-login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return {
    user,
    authUser,
    loading,
    isAuthenticated: !!user,
    signOut,
  };
}

export function useSupabaseAuthZustand() {
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    getInitialSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading]);
}
