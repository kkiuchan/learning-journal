import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Suspense } from "react";
import { UnitsList } from "./components/UnitsList";

export default async function UnitsPage() {
  const session = await getServerSession(authConfig);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユニット一覧</h1>
        {session ? (
          <Button asChild>
            <Link href="/units/new">新規ユニット作成</Link>
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
