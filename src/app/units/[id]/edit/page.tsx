"use client";

import { revalidateUnitDataAction } from "@/app/actions/revalidate";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { UnitForm, UnitFormValues } from "./components/UnitForm";

type Unit = {
  id: number;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  displayFlag: boolean;
  unitTags: {
    tag: {
      id: number;
      name: string;
    };
  }[];
};

export default function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState<Unit | null>(null);
  const { id } = use(params);

  useEffect(() => {
    fetchUnit();
  }, [id]);

  const fetchUnit = async () => {
    try {
      const response = await fetch(`/api/units/${id}`);
      const data = await response.json();

      if (response.ok) {
        setUnit(data.data);
      } else {
        console.error("ユニットの取得に失敗しました:", data.error);
        toast.error("ユニットの取得に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      toast.error("エラーが発生しました");
    }
  };

  const handleSubmit = async (values: UnitFormValues) => {
    if (!session?.user || !unit) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          learningGoal: values.learningGoal,
          preLearningState: values.preLearningState,
          reflection: values.reflection,
          nextAction: values.nextAction,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          status: values.status,
          displayFlag: values.displayFlag,
          unitTags: values.tags.map((tag) => tag.name),
        }),
      });

      if (response.ok) {
        await revalidateUnitDataAction(unit.id);
        await mutate(`/api/units/${unit.id}`); // SWRキャッシュを即時更新
        toast.success("ユニットを更新しました");
        router.push(`/units/${unit.id}`);
      } else {
        const error = await response.json();
        console.error("ユニットの更新に失敗しました:", error);
        toast.error("ユニットの更新に失敗しました");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (!unit) {
    return <div>読み込み中...</div>;
  }

  const initialValues: UnitFormValues = {
    title: unit.title,
    learningGoal: unit.learningGoal || "",
    preLearningState: unit.preLearningState || "",
    reflection: unit.reflection || "",
    nextAction: unit.nextAction || "",
    startDate: unit.startDate
      ? new Date(unit.startDate).toISOString().split("T")[0]
      : "",
    endDate: unit.endDate
      ? new Date(unit.endDate).toISOString().split("T")[0]
      : "",
    status: unit.status,
    displayFlag: unit.displayFlag,
    tags: unit.unitTags.map((ut) => ({
      id: ut.tag.id,
      name: ut.tag.name,
    })),
  };

  return (
    <div className="container mx-auto py-8">
      <UnitForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
