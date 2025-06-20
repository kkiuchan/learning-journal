"use client";

import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { useState } from "react";
import { toast } from "sonner";

type EmailType =
  | "payment-success"
  | "payment-failed"
  | "expiry-warning"
  | "subscription-cancelled"
  | "subscription-updated"
  | "subscription-reactivated";

export default function TestAllEmailsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(7);
  const [loading, setLoading] = useState<EmailType | null>(null);
  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  const sendTestEmail = async (type: EmailType) => {
    setLoading(type);

    try {
      const endpoints: Record<EmailType, string> = {
        "payment-success": "/api/test-payment-email",
        "payment-failed": "/api/test-payment-failed-email",
        "expiry-warning": "/api/test-expiry-warning-email",
        "subscription-cancelled": "/api/test-subscription-emails",
        "subscription-updated": "/api/test-subscription-emails",
        "subscription-reactivated": "/api/test-subscription-emails",
      };

      let body: any = { email, name };

      if (type === "expiry-warning") {
        body.daysUntilExpiry = daysUntilExpiry;
      } else if (type.startsWith("subscription-")) {
        body.type = type.replace("subscription-", "");
      }

      const response = await fetch(endpoints[type], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "メール送信に失敗しました");
      }

      toast.success(data.message);
      console.log("送信詳細:", data.details);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "エラーが発生しました"
      );
    } finally {
      setLoading(null);
    }
  };

  const emailTests = [
    {
      type: "payment-success" as EmailType,
      title: "支払い成功メール",
      description: "支払い完了時に送信されるメール",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-800",
      buttonColor: "bg-green-600 hover:bg-green-700",
      features: [
        "支払い金額: ¥680",
        "レシートURLリンク",
        "プロプラン機能案内",
        "サポート連絡先",
      ],
    },
    {
      type: "payment-failed" as EmailType,
      title: "支払い失敗メール",
      description: "支払い処理が失敗した時に送信されるメール",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-800",
      buttonColor: "bg-red-600 hover:bg-red-700",
      features: [
        "支払い失敗の通知",
        "対処方法の案内",
        "支払い方法更新リンク",
        "注意事項（機能制限）",
      ],
    },
    {
      type: "expiry-warning" as EmailType,
      title: "期間終了前警告メール",
      description: "プロプラン期間終了前に送信される警告メール",
      color: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-800",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      features: [
        "期間終了日の通知",
        "機能制限の説明",
        "継続手続きの案内",
        "プラン管理リンク",
      ],
    },
    {
      type: "subscription-cancelled" as EmailType,
      title: "サブスクキャンセルメール",
      description: "サブスクリプションキャンセル時に送信されるメール",
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-800",
      buttonColor: "bg-orange-600 hover:bg-orange-700",
      features: [
        "キャンセル確認通知",
        "期間終了日の案内",
        "機能制限の説明",
        "再開リンク",
      ],
    },
    {
      type: "subscription-updated" as EmailType,
      title: "サブスク更新メール",
      description: "サブスクリプション更新時に送信されるメール",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-800",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      features: [
        "更新完了通知",
        "次回更新日の案内",
        "プロプラン機能確認",
        "ダッシュボードリンク",
      ],
    },
    {
      type: "subscription-reactivated" as EmailType,
      title: "サブスク再開メール",
      description: "サブスクリプション再開時に送信されるメール",
      color: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-800",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700",
      features: [
        "再開完了通知",
        "次回更新日の案内",
        "プロプラン機能確認",
        "ダッシュボードリンク",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">メール機能統合テスト</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">共通設定</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              placeholder="テストユーザー"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="days" className="block text-sm font-medium mb-2">
            期間終了までの日数（警告メール用）
          </label>
          <select
            id="days"
            value={daysUntilExpiry}
            onChange={(e) => setDaysUntilExpiry(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value={1}>1日前</option>
            <option value={7}>7日前</option>
            <option value={14}>14日前</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {emailTests.map((test) => (
          <div
            key={test.type}
            className={`${test.color} border rounded-lg p-6`}
          >
            <h3 className={`text-lg font-semibold ${test.textColor} mb-2`}>
              {test.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{test.description}</p>

            <ul className="text-sm text-gray-700 space-y-1 mb-6">
              {test.features.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>

            <button
              onClick={() => sendTestEmail(test.type)}
              disabled={!email || loading === test.type}
              className={`w-full ${test.buttonColor} text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading === test.type ? "送信中..." : "テスト送信"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          テスト項目チェックリスト
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium mb-2">メール共通項目</h4>
            <ul className="space-y-1">
              <li>☐ 送信者が正しく表示される</li>
              <li>☐ 返信先がサポートアドレスになっている</li>
              <li>☐ HTMLデザインが正しく表示される</li>
              <li>☐ リンクが正しく動作する</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">個別項目</h4>
            <ul className="space-y-1">
              <li>☐ 金額表示が正しい（¥680）</li>
              <li>☐ 日付表示が正しい</li>
              <li>☐ ユーザー名が正しく挿入される</li>
              <li>☐ 適切なアクションボタンが表示される</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
