"use client";

import { Suspense } from "react";
import { UnitsList } from "./components/UnitsList";

export default function UnitsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">ユニット一覧</h1>
      <div className="space-y-8">
        <Suspense fallback={<div>読み込み中...</div>}>
          <UnitsList />
        </Suspense>
      </div>
    </div>
  );
}
