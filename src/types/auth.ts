import { z } from "zod";

// セッション情報の型
export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
    image: z.string().nullable(),
  }),
  expires: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;

// 認証エラーの型
export const authErrorSchema = z.object({
  error: z.string(),
  status: z.number(),
});

export type AuthError = z.infer<typeof authErrorSchema>;

// 認証リクエストの型
export const authRequestSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  name: z.string().min(1, "名前は1文字以上で入力してください"),
});

export type AuthRequest = z.infer<typeof authRequestSchema>;

// 認証レスポンスの型
export const authResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
  }),
  token: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
