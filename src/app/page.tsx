// サーバーコンポーネント
export const revalidate = 3600; // 1時間ごとに再生成

import { CTASection } from "@/app/components/landing/CTASection";
import { FeaturesSection } from "@/app/components/landing/FeaturesSection";
import { HeroSection } from "@/app/components/landing/HeroSection";
import { UseCasesSection } from "@/app/components/landing/UseCasesSection";
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
