import { Suspense } from "react";
import { SearchForm } from "./components/SearchForm";
import UserList from "./components/UserList";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const query = searchParams.q || "*";
  console.log("query:", query);
  const pageNumber =
    searchParams.page && !isNaN(Number(searchParams.page))
      ? Number(searchParams.page)
      : 1;
  console.log("pageNumber:", pageNumber);
  const limitNumber =
    searchParams.limit && !isNaN(Number(searchParams.limit))
      ? Number(searchParams.limit)
      : 20;
  console.log("limitNumber:", limitNumber);

  const tag = `user-list-${encodeURIComponent(query)}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/users/search?query=${query}&page=${pageNumber}&limit=${limitNumber}`,
    { next: { tags: [tag] } }
  );
  const data = await res.json();
  console.log("data:", data);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">ユーザー検索</h1>
        <div className="space-y-8">
          <SearchForm />
          <UserList users={data.data.users} pagination={data.data.pagination} />
        </div>
      </div>
    </Suspense>
  );
}
