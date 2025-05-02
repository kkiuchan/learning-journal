"use client";

import { BookOpen, LineChart, Sparkles, Users } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 rounded-lg border bg-card transition-all hover:shadow-lg">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      title: "学習ログ管理",
      description:
        "日々の学習内容を記録し、簡単に振り返ることができます。学びを整理し、知識を定着させましょう。",
    },
    {
      icon: <LineChart className="w-6 h-6 text-primary" />,
      title: "進捗の可視化",
      description:
        "学習の進み具合をグラフで分かりやすく表示。モチベーション維持に役立ちます。",
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "仲間との共有",
      description:
        "学習仲間と進捗を共有し、互いに刺激し合いながら成長できます。",
    },
    {
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      title: "AI支援機能",
      description:
        "AIがあなたの学習記録を分析し、より効果的な学習方法を提案します。",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">主な機能</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Learning Journalは、あなたの学習をサポートする様々な機能を提供します。
          効率的な学習管理で、目標達成をお手伝いします。
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
