"use client";

import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// フォームバリデーションスキーマ
const contactSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  subject: z.string().min(1, "件名を入力してください"),
  category: z.enum(["general", "technical", "billing", "feature"], {
    errorMap: () => ({ message: "カテゴリを選択してください" }),
  }),
  message: z.string().min(10, "お問い合わせ内容は10文字以上入力してください"),
});

type ContactForm = z.infer<typeof contactSchema>;

const categories = [
  { value: "general", label: "一般的なお問い合わせ" },
  { value: "technical", label: "技術的な問題" },
  { value: "billing", label: "請求・支払いについて" },
  { value: "feature", label: "機能追加のご提案" },
];

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactForm, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // エラーをクリア
    if (errors[name as keyof ContactForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      contactSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof ContactForm, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof ContactForm;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("入力内容に不備があります");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "送信に失敗しました");
      }

      toast.success("お問い合わせを送信しました。返信をお待ちください。");

      // フォームをリセット
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "general",
        message: "",
      });
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "送信中にエラーが発生しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">お問い合わせフォーム</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* お名前 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-1"
          >
            お名前 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
              errors.name ? "border-destructive" : "border-input"
            }`}
            placeholder="山田太郎"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* メールアドレス */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1"
          >
            メールアドレス <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
              errors.email ? "border-destructive" : "border-input"
            }`}
            placeholder="example@email.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* カテゴリ */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-foreground mb-1"
          >
            お問い合わせカテゴリ <span className="text-destructive">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
              errors.category ? "border-destructive" : "border-input"
            }`}
            disabled={isSubmitting}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-destructive">{errors.category}</p>
          )}
        </div>

        {/* 件名 */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-foreground mb-1"
          >
            件名 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
              errors.subject ? "border-destructive" : "border-input"
            }`}
            placeholder="例：サブスクリプションの解約について"
            disabled={isSubmitting}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-destructive">{errors.subject}</p>
          )}
        </div>

        {/* お問い合わせ内容 */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-foreground mb-1"
          >
            お問い合わせ内容 <span className="text-destructive">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={formData.message}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none ${
              errors.message ? "border-destructive" : "border-input"
            }`}
            placeholder="お問い合わせ内容を詳しくご記入ください。技術的な問題の場合は、お使いのブラウザやエラーメッセージも併せてお知らせください。"
            disabled={isSubmitting}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-destructive">{errors.message}</p>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? "送信中..." : "お問い合わせを送信"}
        </button>
      </form>

      <div className="mt-4 text-xs text-muted-foreground">
        <p>
          <span className="text-destructive">*</span> 印は必須項目です。
          お問い合わせいただいた内容に対しては、通常1〜2営業日以内にご返信いたします。
        </p>
      </div>
    </div>
  );
}
