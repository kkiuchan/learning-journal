"use client";

import { motion } from "framer-motion";
import { Book, Briefcase, Code, GraduationCap } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface UseCaseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string[];
  index: number;
}

function UseCaseCard({
  icon,
  title,
  description,
  examples,
  index,
}: UseCaseCardProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={
        inView
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: index % 2 === 0 ? -50 : 50 }
      }
      transition={{ duration: 0.8, delay: index * 0.2 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="p-6 rounded-lg border bg-card relative group"
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          delay: index * 0.2,
        }}
        className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <motion.ul
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="space-y-2"
      >
        {examples.map((example, i) => (
          <motion.li
            key={i}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 },
            }}
            className="flex items-center text-sm"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 + 0.5 }}
              className="w-1.5 h-1.5 rounded-full bg-primary mr-2"
            />
            {example}
          </motion.li>
        ))}
      </motion.ul>

      {/* 装飾的な背景要素 */}
      <motion.div
        className="absolute -z-10 inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg opacity-0 group-hover:opacity-100"
        initial={false}
        animate={inView ? { scale: [0.8, 1] } : { scale: 0.8 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export function UseCasesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const useCases = [
    {
      icon: <Code className="w-6 h-6 text-primary" />,
      title: "プログラミング学習",
      description: "プログラミング言語やフレームワークの学習進捗を管理",
      examples: [
        "言語やフレームワークの習得",
        "プロジェクト開発の記録",
        "技術書の読書記録",
      ],
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-primary" />,
      title: "資格試験対策",
      description: "資格取得に向けた学習計画と進捗管理",
      examples: [
        "試験範囲の学習進捗",
        "模擬試験の結果記録",
        "苦手分野の克服状況",
      ],
    },
    {
      icon: <Briefcase className="w-6 h-6 text-primary" />,
      title: "ビジネススキル",
      description: "キャリアアップに必要なスキルの習得を記録",
      examples: [
        "マネジメントスキル",
        "コミュニケーション能力",
        "リーダーシップ開発",
      ],
    },
    {
      icon: <Book className="w-6 h-6 text-primary" />,
      title: "語学学習",
      description: "語学力向上のための学習記録と目標管理",
      examples: [
        "単語・文法の習得状況",
        "リーディング・リスニング練習",
        "会話練習の記録",
      ],
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
    <section className="py-20 relative overflow-hidden">
      {/* パララックス背景要素 */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(var(--primary-rgb), 0.1) 0%, transparent 50%)",
        }}
        animate={{
          y: [-20, 20, -20],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

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
            活用シーン
          </motion.h2>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Learning Journalは、様々な学習シーンで活用できます。
            あなたの学習スタイルに合わせて、柔軟に活用してください。
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={index} {...useCase} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
