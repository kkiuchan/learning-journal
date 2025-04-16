import { Suspense } from "react";
import { SearchForm } from "./components/SearchForm";
import { UserList } from "./components/UserList";

export default function UsersPage() {
  return (
    <Suspense fallback={<div></div>}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">ユーザー検索</h1>
        <div className="space-y-8">
          <SearchForm />
          <UserList />
        </div>
      </div>
    </Suspense>
  );
}
