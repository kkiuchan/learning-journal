import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "機能紹介",
  description: "Learning Journalの主要な機能について説明します。",
};

const features = [
  {
    title: "学習ユニット管理",
    description:
      "学習内容を整理し、進捗を可視化。目標設定から振り返りまでをサポートします。",
    icon: "book",
    details: [
      "カスタマイズ可能な学習カテゴリー",
      "進捗トラッキング機能",
      "目標設定と達成管理",
      "学習時間の記録と分析",
    ],
    status: "available",
  },
  {
    title: "学習ログ記録",
    description: "日々の学習内容を簡単に記録。振り返りと改善をサポートします。",
    icon: "pencil",
    details: [
      "マークダウン形式でのログ記録",
      "画像やファイルの添付機能",
      "タグ付けとカテゴリー分類",
      "検索と絞り込み機能",
    ],
    status: "available",
  },
  {
    title: "進捗分析",
    description: "学習データを視覚化し、効果的な学習計画をサポートします。",
    icon: "chart",
    details: [
      "学習時間の統計グラフ",
      "目標達成率の可視化",
      "学習パターンの分析",
      "月別・週別の学習サマリー",
    ],
    status: "available",
  },
  {
    title: "コミュニティ機能",
    description: "他のユーザーと学習体験を共有し、モチベーションを高めます。",
    icon: "users",
    details: [
      "学習ログの共有設定",
      "コメントとフィードバック",
      "フォロー機能",
      "グループ学習機能",
    ],
    status: "coming_soon",
    // releaseDate: "2025年夏頃",
  },
  {
    title: "リマインダー設定",
    description: "定期的な学習習慣の形成をサポートします。",
    icon: "bell",
    details: [
      "カスタマイズ可能な通知設定",
      "学習予定の管理",
      "目標期限のリマインド",
      "進捗状況の定期レポート",
    ],
    status: "coming_soon",
    // releaseDate: "2025年秋頃",
  },
  {
    title: "学習リソース管理",
    description: "学習に使用する教材やリソースを一元管理します。",
    icon: "folder",
    details: [
      "ブックマーク機能",
      "リソースの整理と分類",
      "進捗状況の記録",
      "メモと注釈の追加",
    ],
    status: "coming_soon",
    // releaseDate: "2025年冬頃",
  },
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">機能紹介</h1>
        <p className="text-xl text-muted-foreground">
          Learning Journalの主要な機能をご紹介します
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow relative"
          >
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-2 rounded-full mr-4">
                {(() => {
                  const Icon = Icons[feature.icon as keyof typeof Icons];
                  return <Icon className="h-6 w-6 text-primary" />;
                })()}
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{feature.title}</h2>
                {feature.status === "coming_soon" && (
                  <Badge variant="secondary" className="text-xs">
                    開発中
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-muted-foreground mb-4">{feature.description}</p>

            <ul className="space-y-2 mb-4">
              {feature.details.map((detail) => (
                <li key={detail} className="flex items-center">
                  <Icons.check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">{detail}</span>
                </li>
              ))}
            </ul>

            {feature.status === "coming_soon" && feature.releaseDate && (
              <p className="text-sm text-muted-foreground mt-4 italic">
                リリース予定: {feature.releaseDate}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        {/* <h2 className="text-2xl font-bold mb-4">さらに多くの機能を追加予定</h2> */}
        <p className="text-muted-foreground">
          ユーザーの皆様のフィードバックを基に、
          <br />
          より使いやすい機能を継続的に開発しています。
        </p>
      </div>
    </div>
  );
}
