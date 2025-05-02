"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface AchievementLevelProps {
  initialLevel?: number;
  onUpdate: (level: number) => void;
  isEditing?: boolean;
}

export function AchievementLevel({
  initialLevel = 0,
  onUpdate,
  isEditing = false,
}: AchievementLevelProps) {
  const [level, setLevel] = useState(initialLevel);

  const handleUpdate = () => {
    onUpdate(level);
  };

  const getLevelText = (value: number) => {
    if (value < 20) return "まだまだこれから";
    if (value < 40) return "基礎を理解し始めた";
    if (value < 60) return "ある程度理解できている";
    if (value < 80) return "かなり理解が深まった";
    return "目標を達成できた";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>目標達成度の自己評価</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{getLevelText(level)}</div>
            <div className="text-sm text-muted-foreground">{level}%</div>
          </div>
          <Slider
            value={[level]}
            onValueChange={([value]) => setLevel(value)}
            max={100}
            step={5}
            disabled={!isEditing}
            className="cursor-pointer"
          />
          {isEditing && (
            <Button onClick={handleUpdate} className="w-full">
              評価を更新
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
