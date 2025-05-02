"use client";

import { Book, Briefcase, Code, GraduationCap } from "lucide-react";

interface UseCaseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string[];
}

function UseCaseCard({ icon, title, description, examples }: UseCaseCardProps) {
  return (
    <div className="p-6 rounded-lg border bg-card">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-2">
        {examples.map((example, index) => (
          <li key={index} className="flex items-center text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
            {example}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UseCasesSection() {
  const useCases = [
    {
      icon: <Code className="w-6 h-6 text-primary" />,
      title: "プログラミング学習",
      description: "言語やフレームワークの学習進捗を記録",
      examples: [
        "React/Next.jsの学習記録",
        "アルゴリズムの学習ログ",
        "プロジェクト開発の記録",
      ],
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-primary" />,
      title: "資格試験対策",
      description: "試験勉強の進捗管理と振り返り",
      examples: [
        "AWS認定試験の学習記録",
        "TOEIC対策の進捗管理",
        "基本情報技術者試験の学習",
      ],
    },
    {
      icon: <Book className="w-6 h-6 text-primary" />,
      title: "語学学習",
      description: "語学学習の記録と目標管理",
      examples: [
        "英語学習の日記",
        "単語・フレーズの記録",
        "スピーキング練習の振り返り",
      ],
    },
    {
      icon: <Briefcase className="w-6 h-6 text-primary" />,
      title: "ビジネススキル",
      description: "ビジネススキルの向上と記録",
      examples: [
        "マネジメント知識の学習",
        "プレゼンテーションスキル",
        "リーダーシップ開発",
      ],
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">活用シーン</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Learning Journalは、様々な学習シーンで活用できます。
          あなたの学習スタイルに合わせて、柔軟に活用してください。
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={index} {...useCase} />
          ))}
        </div>
      </div>
    </section>
  );
}
