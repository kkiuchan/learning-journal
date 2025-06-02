"use client";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useModal } from "@/contexts/ModalContext";
import { Plus } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";
import { Suspense } from "react";
import { UnitsList } from "./UnitsList";

interface UnitsPageClientProps {
  session: Session | null;
}

export function UnitsPageClient({ session }: UnitsPageClientProps) {
  const { openCreateUnitModal } = useModal();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユニット一覧</h1>
        {session ? (
          <Button onClick={openCreateUnitModal}>
            <Plus className="w-4 h-4 mr-2" />
            新規ユニット作成
          </Button>
        ) : (
          <Button asChild>
            <Link href="/auth/login">ログインして投稿</Link>
          </Button>
        )}
      </div>
      <Suspense fallback={<Loading text="ユニットを読み込み中..." />}>
        <UnitsList />
      </Suspense>
    </div>
  );
}
