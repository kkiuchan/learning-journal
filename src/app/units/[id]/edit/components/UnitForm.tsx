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
import { useState } from "react";

export interface Tag {
  id: number;
  name: string;
}

export interface UnitFormValues {
  title: string;
  learningGoal: string;
  preLearningState: string;
  reflection: string;
  nextAction: string;
  startDate: string;
  endDate: string;
  status: string;
  tags: Tag[];
}

interface UnitFormProps {
  initialValues: UnitFormValues;
  onSubmit: (values: UnitFormValues) => Promise<void>;
  isLoading: boolean;
}

export function UnitForm({
  initialValues,
  onSubmit,
  isLoading,
}: UnitFormProps) {
  const [values, setValues] = useState<UnitFormValues>(initialValues);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim()) {
      setValues((prev) => ({
        ...prev,
        tags: [...prev.tags, { id: Date.now(), name: newTag.trim() }],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== tagId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
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
              value={values.title}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningGoal">学習目標</Label>
            <Textarea
              id="learningGoal"
              value={values.learningGoal}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, learningGoal: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preLearningState">事前の学習状態</Label>
            <Textarea
              id="preLearningState"
              value={values.preLearningState}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  preLearningState: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reflection">振り返り</Label>
            <Textarea
              id="reflection"
              value={values.reflection}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, reflection: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextAction">次のアクション</Label>
            <Textarea
              id="nextAction"
              value={values.nextAction}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, nextAction: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">開始日</Label>
            <Input
              id="startDate"
              type="date"
              value={values.startDate}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">終了日</Label>
            <Input
              id="endDate"
              type="date"
              value={values.endDate}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <Select
              value={values.status}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">未着手</SelectItem>
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
                placeholder="新しいタグ"
              />
              <Button type="button" onClick={handleAddTag}>
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {values.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "更新中..." : "更新"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
