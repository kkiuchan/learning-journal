import { z } from "zod";
import { Log } from "./index";

// ログリクエストのバリデーションスキーマ
export const logRequestSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  learningTime: z.number().min(0, "学習時間は0以上である必要があります"),
  note: z.string().min(1, "ノートは必須です"),
  logDate: z.string().min(1, "ログ日は必須です"),
  tags: z.array(z.string()).optional(),
  resources: z
    .array(
      z.object({
        id: z.number().optional(),
        resourceType: z.string().nullable(),
        resourceLink: z.string(),
        description: z.string().nullable(),
        fileName: z.string().optional(),
        filePath: z.string().optional(),
      })
    )
    .optional(),
});

// ログリクエストの型
export type LogRequest = z.infer<typeof logRequestSchema>;

// ログの型は index.ts から import して使用
export type { Log };
