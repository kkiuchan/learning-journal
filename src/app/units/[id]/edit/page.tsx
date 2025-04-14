"use client";

import { revalidateUnitDataAction } from "@/app/actions/revalidate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

type Tag = {
  id: number;
  name: string;
};

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
  tags: Tag[];
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
  const [title, setTitle] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [preLearningState, setPreLearningState] = useState("");
  const [reflection, setReflection] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);

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
        setTitle(data.data.title);
        setLearningGoal(data.data.learningGoal || "");
        setPreLearningState(data.data.preLearningState || "");
        setReflection(data.data.reflection || "");
        setNextAction(data.data.nextAction || "");
        setStartDate(
          data.data.startDate
            ? new Date(data.data.startDate).toISOString().split("T")[0]
            : ""
        );
        setEndDate(
          data.data.endDate
            ? new Date(data.data.endDate).toISOString().split("T")[0]
            : ""
        );
        setStatus(data.data.status);
        setTags(data.data.tags);
      } else {
        console.error("ユニットの取得に失敗しました:", data.error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([...tags, { id: Date.now(), name: newTag.trim() }]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setTags(tags.filter((tag) => tag.id !== tagId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !unit) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          learningGoal,
          preLearningState,
          reflection,
          nextAction,
          startDate: startDate || null,
          endDate: endDate || null,
          status,
          unitTags: tags.map((tag) => tag.name),
        }),
      });

      if (response.ok) {
        router.push(`/units/${unit.id}`);
        await revalidateUnitDataAction(unit.id);
      } else {
        const error = await response.json();
        console.error("ユニットの更新に失敗しました:", error);
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!unit) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>ユニットの編集</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningGoal">学習目標</Label>
              <Textarea
                id="learningGoal"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preLearningState">事前の学習状態</Label>
              <Textarea
                id="preLearningState"
                value={preLearningState}
                onChange={(e) => setPreLearningState(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reflection">振り返り</Label>
              <Textarea
                id="reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextAction">次のアクション</Label>
              <Textarea
                id="nextAction"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">終了日</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">未着手</SelectItem>
                  <SelectItem value="IN_PROGRESS">進行中</SelectItem>
                  <SelectItem value="COMPLETED">完了</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>タグ</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="新しいタグを入力"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag}>
                  追加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-1"
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "更新中..." : "更新"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
