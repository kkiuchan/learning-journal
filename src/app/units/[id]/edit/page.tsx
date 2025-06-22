"use client";

import { revalidateUnitDataAction } from "@/app/actions/revalidate";
import { Loading } from "@/components/ui/loading";
import { useUnit } from "@/hooks/useUnit";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { UnitForm, UnitFormValues } from "./components/UnitForm";

export default function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, session } = useAuthStore();
  const accessToken = session?.access_token;
  const [isLoading, setIsLoading] = useState(false);
  const { id } = use(params);

  // SWRを使用してユニットデータを取得
  const { unit, isLoading: isLoadingUnit, error } = useUnit({ unitId: id });

  const handleSubmit = async (values: UnitFormValues) => {
    if (!user || !unit) return;

    try {
      setIsLoading(true);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers,
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

  // ローディング状態
  if (isLoadingUnit) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            エラーが発生しました
          </h1>
          <p className="text-muted-foreground mb-4">
            ユニットの読み込み中にエラーが発生しました。
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // ユニットが見つからない場合
  if (!unit) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">ユニットが見つかりません</h1>
          <p className="text-muted-foreground mb-4">
            指定されたユニットは存在しないか、アクセス権限がありません。
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
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
    tags:
      unit.tags?.map((tag) => ({
        id: tag.id,
        name: tag.name,
      })) || [],
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
