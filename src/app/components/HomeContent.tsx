"use client";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { BookOpen, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function HomeContent({ session }: { session: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLink, setLoadingLink] = useState<string | null>(null);

  const handleLinkClick = (link: string) => {
    setIsLoading(true);
    setLoadingLink(link);
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <Loading text="読み込み中..." />
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              ページに移動しています...
            </p>
          </div>
        </div>
      )}

      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">
          Learning Journal
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8">
          あなたの学習をより効果的に記録・管理・共有しましょう
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto">
        <div
          className="border rounded-lg p-4 sm:p-6 hover:border-primary transition-colors cursor-pointer"
          onClick={() => handleLinkClick("/units")}
        >
          <Link href="/units" className="block" prefetch={true}>
            <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mb-3 sm:mb-4 mx-auto text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-center">
              学習ユニット
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              学習目標を設定し、進捗を管理します
            </p>
          </Link>
        </div>

        <div
          className="border rounded-lg p-4 sm:p-6 hover:border-primary transition-colors cursor-pointer"
          onClick={() => handleLinkClick("/users")}
        >
          <Link href="/users" className="block" prefetch={true}>
            <Search className="w-8 h-8 sm:w-12 sm:h-12 mb-3 sm:mb-4 mx-auto text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-center">
              ユーザー検索
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              他のユーザーの学習記録を参考にします
            </p>
          </Link>
        </div>

        <div
          className="border rounded-lg p-4 sm:p-6 hover:border-primary transition-colors cursor-pointer"
          onClick={() => handleLinkClick(`/users/${session.user?.id}`)}
        >
          <Link
            href={`/users/${session.user?.id}`}
            className="block"
            prefetch={true}
          >
            <User className="w-8 h-8 sm:w-12 sm:h-12 mb-3 sm:mb-4 mx-auto text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-center">
              プロフィール
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              あなたの学習記録を管理します
            </p>
          </Link>
        </div>
      </div>

      <div className="text-center mt-8 sm:mt-12">
        <Button size="lg" onClick={() => handleLinkClick("/units/new")}>
          <Link href="/units/new" prefetch={true}>
            学習を始める
          </Link>
        </Button>
      </div>
    </div>
  );
}
