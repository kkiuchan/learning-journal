"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInView } from "react-intersection-observer";

export function CTASection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleNavigation = async (path: string) => {
    try {
      setIsLoading(path);
      await router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      //   setIsLoading(null);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-6">
            あなたの学習をもっと効率的に
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Learning Journalで、学習の記録と振り返りを始めましょう。
            <br />
            まずは他のユーザーの学習記録を見てみましょう。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!session ? (
              <>
                <Button
                  size="lg"
                  onClick={() => handleNavigation("/auth/login")}
                  disabled={isLoading !== null}
                  className="w-full sm:w-auto"
                >
                  {isLoading === "/auth/login" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  無料で始める
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    handleNavigation("/users/cm9pij88r0000bogga3i0qogr")
                  }
                  disabled={isLoading !== null}
                  className="w-full sm:w-auto"
                >
                  {isLoading === "/users/cm9pij88r0000bogga3i0qogr" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  他のユーザーの学習記録を見る
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={() => handleNavigation("/dashboard")}
                disabled={isLoading !== null}
                className="relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ scale: 1, opacity: 0 }}
                  whileHover={{
                    scale: 1.5,
                    opacity: 0.5,
                    transition: { duration: 0.5 },
                  }}
                />
                <motion.div
                  className="relative z-10 flex items-center"
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading === "/dashboard" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  ダッシュボードへ
                </motion.div>
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2,
          }}
        />
      </div>
    </section>
  );
}
