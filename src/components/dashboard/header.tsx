"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useModal } from "@/contexts/ModalContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardHeader() {
  const { session, loading } = useSupabaseAuth();
  const router = useRouter();
  const { openCreateUnitModal } = useModal();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const handleNavigation = async (path: string) => {
    try {
      setLoadingPath(path);
      await router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      setLoadingPath(null);
    }
  };

  const profilePath = session?.user?.id ? `/users/${session.user.id}` : null;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          あなたの学習進捗状況と最近の活動を確認できます。
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={openCreateUnitModal}>
          <Icons.book className="mr-2 h-4 w-4" />
          新規ユニット
        </Button>
        {profilePath && (
          <Button
            variant="outline"
            onClick={() => handleNavigation(profilePath)}
            disabled={loadingPath !== null}
          >
            {loadingPath === profilePath ? (
              <Loading className="mr-2" size="sm" />
            ) : (
              <User className="mr-2 h-4 w-4" />
            )}
            プロフィール
          </Button>
        )}
      </div>
    </div>
  );
}
