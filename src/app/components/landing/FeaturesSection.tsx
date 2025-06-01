"use client";

import { motion } from "framer-motion";
import { BookOpen, LineChart, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  href?: string;
  comingSoon?: boolean;
}

function FeatureCard({
  icon,
  title,
  description,
  index,
  href,
  comingSoon,
}: FeatureCardProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const CardContent = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      className={`p-6 rounded-lg border bg-card transition-all hover:shadow-lg relative group ${
        href ? "cursor-pointer" : ""
      } ${comingSoon ? "opacity-75" : ""}`}
    >
      {comingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            実装予定
          </span>
        </div>
      )}

      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.2,
        }}
        className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 ${
          comingSoon ? "opacity-60" : ""
        }`}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>

      {href && !comingSoon && (
        <div className="mt-3 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          デモを見る →
        </div>
      )}

      {href && comingSoon && (
        <div className="mt-3 text-sm text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          デモを見る（開発中）→
        </div>
      )}

      {!href && comingSoon && (
        <div className="mt-3 text-sm text-orange-600 font-medium">
          近日公開予定
        </div>
      )}

      {/* 装飾的な背景要素 */}
      <motion.div
        className="absolute -z-10 inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg opacity-0 group-hover:opacity-100"
        initial={false}
        animate={inView ? { scale: [0.8, 1] } : { scale: 0.8 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

export function FeaturesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      title: "学習ログ管理",
      description:
        "日々の学習内容を記録し、簡単に振り返ることができます。学びを整理し、知識を定着させましょう。",
      href: "/demo/language",
    },
    {
      icon: <LineChart className="w-6 h-6 text-primary" />,
      title: "進捗の可視化",
      description:
        "学習の進み具合をグラフで分かりやすく表示。モチベーション維持に役立ちます。",
      href: "/demo/dashboard",
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "仲間との共有",
      description:
        "学習仲間と進捗を共有し、互いに刺激し合いながら成長できます。",
      href: "/demo/share",
      comingSoon: true,
    },
    {
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      title: "AI支援機能",
      description:
        "AI支援ウィザードフォームで学習記録作成をサポート。各ステップで適切な提案を受けながら効果的な学習ログを作成できます。",
      href: "/demo/ai-assist",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <section id="features-section" className="py-20 relative overflow-hidden">
      {/* 装飾的な背景要素 */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"
          animate={{
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2,
          }}
        />
      </motion.div>

      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="text-3xl font-bold mb-4"
          >
            主な機能
          </motion.h2>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Learning
            Journalは、あなたの学習をサポートする様々な機能を提供します。
            効率的な学習管理で、目標達成をお手伝いします。
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
