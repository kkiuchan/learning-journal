"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface UnitData {
  id: string;
  title: string;
  progress: number;
  learningGoal: string | null;
  achievementLevel: number;
}

interface ActiveUnitsProps {
  data: UnitData[];
}

export function ActiveUnits({ data }: ActiveUnitsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>進行中のユニット</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {data.map((unit) => (
            <Link
              key={unit.id}
              href={`/units/${unit.id}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{unit.title}</div>
                    <div className="text-sm text-muted-foreground">
                      目標: {unit.learningGoal || "20時間の学習"}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {unit.achievementLevel}%
                  </div>
                </div>
                <Progress
                  value={unit.achievementLevel}
                  className="bg-secondary/50"
                />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
