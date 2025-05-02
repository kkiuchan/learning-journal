// サーバーコンポーネント
export const revalidate = 3600; // 1時間ごとに再生成

import { Loading } from "@/components/ui/loading";
import { Suspense } from "react";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { HeroSection } from "./components/landing/HeroSection";
import { UseCasesSection } from "./components/landing/UseCasesSection";

export default function Home() {
  return (
    <main>
      <Suspense fallback={<Loading text="読み込み中..." />}>
        <HeroSection />
        <FeaturesSection />
        <UseCasesSection />
      </Suspense>
    </main>
  );
}
