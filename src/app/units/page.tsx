"use client";

import { UnitsList } from "./components/UnitsList";

export default function UnitsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">ユニット一覧</h1>
      <UnitsList />
    </div>
  );
}
