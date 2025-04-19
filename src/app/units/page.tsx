"use client";

import { Suspense } from "react";
import { UnitsList } from "./components/UnitsList";
import { Loading } from "@/components/ui/loading";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function UnitsPage() {
  const session = await getServerSession(authOptions);

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
