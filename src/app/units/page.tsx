"use client";

import { Suspense } from "react";
import { UnitsList } from "./components/UnitsList";

export default function UnitsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">ユニット一覧</h1>
      <Suspense fallback={<div>読み込み中...</div>}>
        <UnitsList />
      </Suspense>
    </div>
  );
}
