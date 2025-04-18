// サーバーコンポーネント
export const revalidate = 3600; // 1時間ごとに再生成

import { authConfig } from "@/auth.config";
import { Loading } from "@/components/ui/loading";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HomeContent } from "./components/HomeContent";

export default async function Home() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <Suspense fallback={<Loading text="読み込み中..." />}>
      <HomeContent session={session} />
    </Suspense>
  );
}
