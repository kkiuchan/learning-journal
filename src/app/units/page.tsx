"use client";

import { authConfig } from "@/auth.config";
import { Loading } from "@/components/ui/loading";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UnitsList } from "./components/UnitsList";

export default async function UnitsPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ユニット一覧</h1>
      <Suspense fallback={<Loading text="ユニットを読み込み中..." />}>
        <UnitsList userId={session.user.id} />
      </Suspense>
    </div>
  );
}
