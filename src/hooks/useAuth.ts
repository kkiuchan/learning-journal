import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(requireAuth: boolean = true) {
  const { user, session, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      router.push("/auth/supabase-login");
    }
  }, [user, loading, requireAuth, router]);

  return {
    user,
    session,
    isAuthenticated: !!user,
    isLoading: loading,
  };
}
