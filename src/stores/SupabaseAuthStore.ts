"use client";

import { supabase } from "@/lib/supabase-auth";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  unsubscribeAuth: (() => void) | null;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setUnsubscribeAuth: (fn: (() => void) | null) => void;

  initializeAuth: () => Promise<() => void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      unsubscribeAuth: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setUnsubscribeAuth: (fn) => set({ unsubscribeAuth: fn }),

      initializeAuth: async () => {
        // すでに登録済みなら何もしない
        if (get().unsubscribeAuth) {
          return get().unsubscribeAuth!;
        }

        set({ loading: true });

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          set({
            session,
            user: session?.user ?? null,
            loading: false,
          });
        } catch (error) {
          console.error("Auth initialization error", error);
          set({ loading: false });
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session: Session | null) => {
            set({
              session,
              user: session?.user ?? null,
              loading: false,
            });
          }
        );

        const unsubscribe = () => subscription.unsubscribe();
        set({ unsubscribeAuth: unsubscribe });

        return unsubscribe;
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);
