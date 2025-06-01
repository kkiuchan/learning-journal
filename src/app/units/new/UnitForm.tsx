import { Button } from "@/components/ui/button";
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
  displayFlag: boolean;
  tags: Tag[];
}

interface UnitFormProps {
  values: UnitFormValues;
  setValues: React.Dispatch<React.SetStateAction<UnitFormValues>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function UnitForm({
  values,
  setValues,
  onSubmit,
  isLoading,
}: UnitFormProps) {
  const [newTag, setNewTag] = useState("");
  const [isComposing, setIsComposing] = useState(false);

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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="learningGoal">学習目標</Label>
        <Textarea
          id="learningGoal"
          value={values.learningGoal}
          onChange={(e) =>
            setValues((v) => ({ ...v, learningGoal: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preLearningState">事前の学習状態</Label>
        <Textarea
          id="preLearningState"
          value={values.preLearningState}
          onChange={(e) =>
            setValues((v) => ({ ...v, preLearningState: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reflection">振り返り</Label>
        <Textarea
          id="reflection"
          value={values.reflection}
          onChange={(e) =>
            setValues((v) => ({ ...v, reflection: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nextAction">次のアクション</Label>
        <Textarea
          id="nextAction"
          value={values.nextAction}
          onChange={(e) =>
            setValues((v) => ({ ...v, nextAction: e.target.value }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">開始日</Label>
          <Input
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={(e) =>
              setValues((v) => ({ ...v, startDate: e.target.value }))
            }
            className="cursor-pointer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">終了日</Label>
          <Input
            id="endDate"
            type="date"
            value={values.endDate}
            onChange={(e) =>
              setValues((v) => ({ ...v, endDate: e.target.value }))
            }
            className="cursor-pointer"
            min={values.startDate}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">ステータス</Label>
        <Select
          value={values.status}
          onValueChange={(v) => setValues((prev) => ({ ...prev, status: v }))}
        >
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
        <Label htmlFor="displayFlag">公開設定</Label>
        <Select
          value={values.displayFlag ? "public" : "private"}
          onValueChange={(v) =>
            setValues((prev) => ({ ...prev, displayFlag: v === "public" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="公開設定を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <span className="text-green-600">🌐</span>
                <div>
                  <div className="font-medium">公開</div>
                  <div className="text-xs text-muted-foreground">
                    他のユーザーも閲覧可能
                  </div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <span className="text-orange-600">🔒</span>
                <div>
                  <div className="font-medium">非公開</div>
                  <div className="text-xs text-muted-foreground">
                    自分のみ閲覧可能
                  </div>
                </div>
              </div>
            </SelectItem>
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
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isComposing) {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            追加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {values.tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1 bg-secondary px-2 py-1 rounded"
            >
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "作成中..." : "作成"}
        </Button>
      </div>
    </form>
  );
}
