"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 検索入力の状態を管理
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [isComposing, setIsComposing] = useState(false);

  // 検索条件を更新する関数
  const updateSearchParams = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // 検索入力のデバウンス処理
  useEffect(() => {
    if (isComposing) return; // 日本語入力中は更新しない

    const timer = setTimeout(() => {
      if (searchInput !== searchParams.get("q")) {
        updateSearchParams(searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, searchParams, isComposing]);

  return (
    <div className="w-full max-w-2xl">
      <Input
        type="search"
        placeholder="名前、自己紹介、スキル、興味・関心で検索"
        className="w-full"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => {
          setIsComposing(false);
          setSearchInput((e.target as HTMLInputElement).value);
        }}
      />
    </div>
  );
}
