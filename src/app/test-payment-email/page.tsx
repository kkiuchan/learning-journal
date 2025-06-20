"use client";

import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { useState } from "react";
import { toast } from "sonner";

export default function TestPaymentEmailPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/test-payment-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "メール送信に失敗しました");
      }

      toast.success("支払い成功通知メールを送信しました");
      console.log("送信詳細:", data.details);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">支払い成功メールテスト</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">テスト内容</h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 支払い金額: ¥680（プロプラン月額）</li>
          <li>• レシートURL: テスト用URL</li>
          <li>
            • 送信者: Learning Journal &lt;noreply@learning-journal-app.com&gt;
          </li>
          <li>• 返信先: 環境変数SUPPORT_EMAILで設定されたアドレス</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            メールアドレス *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
            disabled={loading}
            placeholder="test@example.com"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            名前（省略可）
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            disabled={loading}
            placeholder="テストユーザー"
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "送信中..." : "支払い成功メールを送信"}
        </button>
      </form>
    </div>
  );
}
