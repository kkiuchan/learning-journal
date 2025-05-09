"use client";

import { Input } from "@/components/ui/input";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 検索入力の状態を管理
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const { isComposing, onCompositionStart, onCompositionEnd } =
    useCompositionInput();

  const debouncedSearchInput = useDebouncedValue(searchInput, 500);

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
    if (debouncedSearchInput !== searchParams.get("q")) {
      updateSearchParams(debouncedSearchInput);
    }
  }, [debouncedSearchInput, searchParams, isComposing]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="ユーザーを検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
