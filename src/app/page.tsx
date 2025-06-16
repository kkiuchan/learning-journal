// サーバーコンポーネント
export const revalidate = 3600; // 1時間ごとに再生成

import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { AnimatedPage } from "@/components/motion/AnimatedPage";
import { Loading } from "@/components/ui/loading";
import { Suspense } from "react";

export default function Home() {
  return (
    <AnimatedPage>
      <main>
        <Suspense fallback={<Loading text="読み込み中..." />}>
          <HeroSection />
          <FeaturesSection />
          <UseCasesSection />
          <CTASection />
        </Suspense>
      </main>
    </AnimatedPage>
  );
}
