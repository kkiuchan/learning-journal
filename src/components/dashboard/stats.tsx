"use client";

import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsData {
  totalLearningTime: number;
  completedUnitsCount: number;
  activeUnitsCount: number;
  streakDays: number;
}

interface DashboardStatsProps {
  data: StatsData;
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const stats = [
    {
      title: "総学習時間",
      value: `${data.totalLearningTime.toFixed(1)}時間`,
      icon: "chart",
      description: "今月の学習時間",
    },
    {
      title: "完了済みユニット",
      value: `${data.completedUnitsCount}個`,
      icon: "check",
      description: "完了したユニット数",
    },
    {
      title: "進行中ユニット",
      value: `${data.activeUnitsCount}個`,
      icon: "book",
      description: "現在学習中のユニット",
    },
    {
      title: "継続日数",
      value: `${data.streakDays}日`,
      icon: "users",
      description: "連続学習日数",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stats.map((stat) => {
        const Icon = Icons[stat.icon as keyof typeof Icons];
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
