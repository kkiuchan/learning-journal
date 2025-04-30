"use client";

import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { KeyboardEvent, useState } from "react";

export interface TagInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  maxTags?: number;
  disabled?: boolean;
}

export function TagInput({
  placeholder = "タグを入力...",
  tags,
  setTags,
  maxTags = 10,
  disabled = false,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const value = input.trim().toLowerCase();
    if (!value) return;

    // 最大タグ数のチェック
    if (tags.length >= maxTags) {
      return;
    }

    // 重複チェック
    if (tags.includes(value)) {
      setInput("");
      return;
    }

    setTags([...tags, value]);
    setInput("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <div
          key={index}
          className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => handleRemoveTag(index)}
            className="text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {tags.length < maxTags && (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={disabled}
          className="w-32"
        />
      )}
    </div>
  );
}
