"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DebugData {
  user: any;
  stripe: any;
  comparison: any;
}

export default function DebugSubscriptionPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchDebugData = async () => {
    try {
      const response = await fetch("/api/debug-subscription");
      if (response.ok) {
        const data = await response.json();
        setDebugData(data.data);
      } else {
        toast.error("デバッグ情報の取得に失敗しました");
      }
    } catch (error) {
      console.error("Debug fetch error:", error);
      toast.error("デバッグ情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/sync-subscription", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("サブスクリプション情報を同期しました");
        console.log("Sync result:", result);
        // 同期後にデータを再取得
        await fetchDebugData();
      } else {
        const error = await response.json();
        toast.error(`同期に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("同期に失敗しました");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">サブスクリプションデバッグ</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">サブスクリプションデバッグ</h1>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? "同期中..." : "Stripeと同期"}
        </Button>
      </div>

      {debugData && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* データベース情報 */}
          <Card>
            <CardHeader>
              <CardTitle>データベース (現在の状態)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Email:</strong> {debugData.user.email}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {debugData.user.subscriptionStatus || "null"}
              </div>
              <div>
                <strong>Plan:</strong>{" "}
                {debugData.user.subscriptionPlan || "null"}
              </div>
              <div>
                <strong>Cancel At Period End:</strong>{" "}
                {debugData.user.cancelAtPeriodEnd?.toString() || "null"}
              </div>
              <div>
                <strong>Canceled At:</strong>{" "}
                {debugData.user.canceledAt || "null"}
              </div>
              <div>
                <strong>Subscription End:</strong>{" "}
                {debugData.user.subscriptionEnd || "null"}
              </div>
              <div>
                <strong>Trial End:</strong> {debugData.user.trialEnd || "null"}
              </div>
            </CardContent>
          </Card>

          {/* Stripe情報 */}
          <Card>
            <CardHeader>
              <CardTitle>Stripe (真の状態)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {debugData.stripe.subscription ? (
                <>
                  <div>
                    <strong>ID:</strong> {debugData.stripe.subscription.id}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {debugData.stripe.subscription.status}
                  </div>
                  <div>
                    <strong>Cancel At Period End:</strong>{" "}
                    {debugData.stripe.subscription.cancel_at_period_end?.toString()}
                  </div>
                  <div>
                    <strong>Canceled At:</strong>{" "}
                    {debugData.stripe.subscription.canceled_at || "null"}
                  </div>
                  <div>
                    <strong>Current Period End:</strong>{" "}
                    {debugData.stripe.subscription.current_period_end
                      ? new Date(
                          debugData.stripe.subscription.current_period_end *
                            1000
                        ).toISOString()
                      : "null"}
                  </div>
                  <div>
                    <strong>Trial End:</strong>{" "}
                    {debugData.stripe.subscription.trial_end
                      ? new Date(
                          debugData.stripe.subscription.trial_end * 1000
                        ).toISOString()
                      : "null"}
                  </div>
                </>
              ) : (
                <p>Stripeサブスクリプションが見つかりません</p>
              )}
            </CardContent>
          </Card>

          {/* 比較結果 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>データベースとStripeの比較</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Cancel At Period End</h4>
                  <div>
                    Database:{" "}
                    {debugData.comparison.cancelAtPeriodEnd.database?.toString() ||
                      "null"}
                  </div>
                  <div>
                    Stripe:{" "}
                    {debugData.comparison.cancelAtPeriodEnd.stripe?.toString() ||
                      "null"}
                  </div>
                  <div
                    className={`font-bold ${debugData.comparison.cancelAtPeriodEnd.match ? "text-green-600" : "text-red-600"}`}
                  >
                    {debugData.comparison.cancelAtPeriodEnd.match
                      ? "✅ 一致"
                      : "❌ 不一致"}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <div>
                    Database: {debugData.comparison.status.database || "null"}
                  </div>
                  <div>
                    Stripe: {debugData.comparison.status.stripe || "null"}
                  </div>
                  <div
                    className={`font-bold ${debugData.comparison.status.match ? "text-green-600" : "text-red-600"}`}
                  >
                    {debugData.comparison.status.match
                      ? "✅ 一致"
                      : "❌ 不一致"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>使用方法</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>上記でデータベースとStripeの状態の違いを確認</li>
            <li>不一致がある場合は「Stripeと同期」ボタンをクリック</li>
            <li>webhook が正常に動作していない場合、手動同期で解決</li>
            <li>プライシングページで解約予約状態が正しく表示されるか確認</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
