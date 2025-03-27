import { z } from "zod";

const ALLOWED_PROVIDERS = ["google", "github", "email"] as const;

export const userRegistrationSchema = z.object({
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください" })
    .min(1, { message: "メールアドレスは必須です" }),
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上必要です" })
    .regex(/[A-Z]/, { message: "パスワードには大文字を含める必要があります" })
    .regex(/[a-z]/, { message: "パスワードには小文字を含める必要があります" })
    .regex(/[0-9]/, { message: "パスワードには数字を含める必要があります" })
    .regex(/[^A-Za-z0-9]/, {
      message: "パスワードには特殊文字を含める必要があります",
    })
    .optional(),
  provider: z
    .enum(ALLOWED_PROVIDERS, {
      errorMap: () => ({ message: "無効な認証プロバイダーです" }),
    })
    .optional(),
});

export const userLoginSchema = z.object({
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(8, { message: "パスワードは8文字以上必要です" }),
});
