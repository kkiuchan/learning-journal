export const revalidate = 3600; // 1時間ごとに再生成

import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { BookOpen, Search, User } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function HomeContent({ session }: { session: any }) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Learning Journal</h1>
        <p className="text-xl text-muted-foreground mb-8">
          あなたの学習をより効果的に記録・管理・共有しましょう
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <Link href="/units" className="block" prefetch={true}>
          <div className="border rounded-lg p-6 hover:border-primary transition-colors">
            <BookOpen className="w-12 h-12 mb-4 mx-auto text-primary" />
            <h2 className="text-xl font-semibold mb-2 text-center">
              学習ユニット
            </h2>
            <p className="text-muted-foreground text-center">
              学習目標を設定し、進捗を管理します
            </p>
          </div>
        </Link>

        <Link href="/users" className="block" prefetch={true}>
          <div className="border rounded-lg p-6 hover:border-primary transition-colors">
            <Search className="w-12 h-12 mb-4 mx-auto text-primary" />
            <h2 className="text-xl font-semibold mb-2 text-center">
              ユーザー検索
            </h2>
            <p className="text-muted-foreground text-center">
              他のユーザーの学習記録を参考にします
            </p>
          </div>
        </Link>

        <Link
          href={`/users/${session.user?.id}`}
          className="block"
          prefetch={true}
        >
          <div className="border rounded-lg p-6 hover:border-primary transition-colors">
            <User className="w-12 h-12 mb-4 mx-auto text-primary" />
            <h2 className="text-xl font-semibold mb-2 text-center">
              プロフィール
            </h2>
            <p className="text-muted-foreground text-center">
              あなたの学習記録を管理します
            </p>
          </div>
        </Link>
      </div>

      <div className="text-center mt-12">
        <Button asChild size="lg">
          <Link href="/units/new" prefetch={true}>
            学習を始める
          </Link>
        </Button>
      </div>
    </div>
  );
}

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
