"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import UnitForm, { UnitFormValues } from "../UnitForm";

export function NewUnitClient() {
  const router = useRouter();
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState<UnitFormValues>({
    title: "",
    learningGoal: "",
    preLearningState: "",
    reflection: "",
    nextAction: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    status: "PLANNED",
    displayFlag: true,
    tags: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch("/api/units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formValues,
          tags: formValues.tags.map((tag) => tag.name),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        router.push(`/units/${data.data.id}`);
      } else {
        const error = await response.json();
        console.error("ユニットの作成に失敗しました:", error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>新規ユニット作成</CardTitle>
        </CardHeader>
        <CardContent>
          <UnitForm
            values={formValues}
            setValues={setFormValues}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
