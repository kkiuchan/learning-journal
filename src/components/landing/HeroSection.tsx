"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { AuthSession } from "@/types/auth";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Brain, Clock, LineChart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

export function HeroSection() {
  const { session: supabaseSession } = useAuthStore();

  // Supabaseセッションを NextAuth.js 互換形式に変換
  const session: AuthSession | null = supabaseSession
    ? {
        user: {
          id: supabaseSession.user.id,
          email: supabaseSession.user.email || "",
          name:
            supabaseSession.user.user_metadata?.name ||
            supabaseSession.user.user_metadata?.full_name ||
            "",
          image:
            supabaseSession.user.user_metadata?.avatar_url ||
            supabaseSession.user.user_metadata?.picture ||
            "",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : null;

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [scrollAmount, setScrollAmount] = useState(0);
  const SCROLL_THRESHOLD = 100; // スクロールのしきい値（ピクセル）
  const lastTouchY = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const { scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const challengesY = useTransform(scrollY, [0, 100], [100, 0]);
  const challengesOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [typedText, setTypedText] = useState("");
  const fullText = "学習の記録を、\nもっとスマートに";
  const [currentIndex, setCurrentIndex] = useState(0);

  // タイピングアニメーションの制御（スクロール制御から独立）
  useEffect(() => {
    if (inView && currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 100);

      if (currentIndex === fullText.length - 1) {
        setIsTypingComplete(true);
      }

      return () => clearTimeout(timeout);
    }
  }, [inView, currentIndex, fullText.length]);

  // スクロール制御（タイピングアニメーションから独立）
  useEffect(() => {
    let accumulatedScroll = 0;

    const handleWheel = (e: WheelEvent) => {
      if (!showChallenges) {
        e.preventDefault();

        // 累積スクロール量を計算
        accumulatedScroll += Math.abs(e.deltaY);
        setScrollAmount(accumulatedScroll);

        // しきい値を超えたら課題を表示
        if (accumulatedScroll >= SCROLL_THRESHOLD) {
          setShowChallenges(true);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!showChallenges) {
        lastTouchY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!showChallenges && lastTouchY.current !== null) {
        const currentY = e.touches[0].clientY;
        const deltaY = Math.abs(currentY - lastTouchY.current);

        // 累積スクロール量を計算
        accumulatedScroll += deltaY;
        setScrollAmount(accumulatedScroll);

        // しきい値を超えたら課題を表示
        if (accumulatedScroll >= SCROLL_THRESHOLD) {
          setShowChallenges(true);
        }

        lastTouchY.current = currentY;
      }
    };

    if (!showChallenges) {
      // マウスホイールのイベントリスナー
      window.addEventListener("wheel", handleWheel, { passive: false });

      // タッチイベントのリスナー
      window.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [showChallenges]);

  // スクロールインジケーターのアニメーション進捗
  const scrollProgress = Math.min(scrollAmount / SCROLL_THRESHOLD, 1);

  const challenges = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "学習時間の管理が難しい",
      solution: "時間の可視化で継続的な学習をサポート",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "学習内容を忘れてしまう",
      solution: "一覧表示された学習記録があなたの学習内容定着を促します",
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "進捗が見えづらい",
      solution: "グラフで成長を実感",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "モチベーション維持が大変",
      solution:
        "学習の積み重ねが見える化されることで、継続するモチベーションを高めます",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const handleNavigation = async (path: string) => {
    try {
      setIsLoading(path);
      // 少し遅延を入れて、ローディング状態を確実に表示
      await new Promise((resolve) => setTimeout(resolve, 100));
      await router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // ボタンコンポーネントの共通スタイル
  const buttonBaseClass =
    "relative overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]";
  const buttonLoadingClass = "cursor-not-allowed opacity-80";

  return (
    <section
      ref={containerRef}
      className="relative min-h-[80vh] flex items-center from-background to-muted/30 overflow-hidden"
    >
      {/* 背景のアニメーション要素 */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 100%)",
            "linear-gradient(45deg, rgba(147,51,234,0.1) 0%, rgba(59,130,246,0.1) 100%)",
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* 装飾的な背景要素 */}
      <motion.div
        className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
      />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="relative"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 whitespace-pre-line"
            >
              {typedText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block ml-1"
              >
                |
              </motion.span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl mb-8 text-muted-foreground"
            >
              Learning Journalで学習記録を管理し、
              <br className="hidden md:inline" />
              あなたの成長を可視化しましょう
            </motion.p>

            <motion.div variants={itemVariants} className="flex gap-4">
              {session ? (
                <>
                  <Button
                    onClick={() => handleNavigation("/units")}
                    size="lg"
                    className={`${buttonBaseClass} group ${
                      isLoading === "/units" ? buttonLoadingClass : ""
                    }`}
                    disabled={isLoading !== null}
                  >
                    <div className="flex items-center gap-2">
                      {isLoading === "/units" && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      学習を始める
                    </div>
                    <motion.span
                      className="absolute inset-0 bg-primary/20"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0.5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      handleNavigation(`/users/${session.user.id}`)
                    }
                    className={`${buttonBaseClass} ${
                      isLoading === `/users/${session.user.id}`
                        ? buttonLoadingClass
                        : ""
                    }`}
                    disabled={isLoading !== null}
                  >
                    <div className="flex items-center gap-2">
                      {isLoading === `/users/${session.user.id}` && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      プロフィールへ
                    </div>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleNavigation("/auth/supabase-login")}
                    size="lg"
                    className={`${buttonBaseClass} group ${
                      isLoading === "/auth/supabase-login"
                        ? buttonLoadingClass
                        : ""
                    }`}
                    disabled={isLoading !== null}
                  >
                    <div className="flex items-center gap-2">
                      {isLoading === "/auth/supabase-login" && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      無料で始める
                    </div>
                    <motion.span
                      className="absolute inset-0 bg-primary/20"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0.5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNavigation("/demo/unit")}
                    className={`${buttonBaseClass} ${
                      isLoading === "/demo/unit" ? buttonLoadingClass : ""
                    }`}
                    disabled={isLoading !== null}
                  >
                    <div className="flex items-center gap-2">
                      {isLoading === "/demo/unit" && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      デモを見る
                    </div>
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* 課題リストのアニメーション */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={
              showChallenges ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }
            }
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={
                  showChallenges ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }
                }
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-card/50 backdrop-blur-sm border rounded-lg p-4 transition-all hover:shadow-lg relative group"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={showChallenges ? { scale: 1 } : { scale: 0 }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                    className="p-2 rounded-full bg-primary/10"
                  >
                    {challenge.icon}
                  </motion.div>
                  <div>
                    <h3 className="font-medium mb-1">{challenge.title}</h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={showChallenges ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ delay: index * 0.2 + 0.5 }}
                      className="text-sm text-muted-foreground"
                    >
                      {challenge.solution}
                    </motion.p>
                  </div>
                </div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg opacity-0 group-hover:opacity-100"
                  initial={false}
                  animate={{ scale: [0.8, 1] }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* スクロールインジケーター（タイピング完了を待たずに表示） */}
      {!showChallenges && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-muted-foreground"
        >
          <div className="relative w-32 h-1 bg-muted rounded-full mb-4 overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${scrollProgress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-sm mb-2">スクロールして課題を見る</p>
          <motion.div
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="w-6 h-6 mx-auto"
          >
            ↓
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
