"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { Crown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

export function AccountClient() {
  const { session } = useAuthStore();
  const accessToken = session?.access_token;

  // SWR fetcher with Supabase auth headers
  const fetcher = (url: string) => {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return fetch(url, { headers }).then((res) => res.json());
  };

  // SWRでサブスクリプション情報を取得
  const { data: subscriptionData, error: subscriptionError } = useSWR(
    session ? "/api/auth/user/subscription" : null,
    fetcher
  );

  // ローディング状態
  if (!subscriptionData && !subscriptionError && session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const subscription = subscriptionData?.data;

  // サブスクリプション状態の表示文字列を生成
  const getSubscriptionStatusDisplay = () => {
    if (!subscription) return "読み込み中...";

    const { currentPlan, subscriptionStatus, subscriptionEnd, trialEnd } =
      subscription;

    if (currentPlan === "PRO") {
      if (subscriptionStatus === "trialing") {
        const trialEndDate = trialEnd
          ? new Date(trialEnd).toLocaleDateString("ja-JP")
          : "";
        return `プロプラン（トライアル中 - ${trialEndDate}まで）`;
      } else if (subscriptionStatus === "active") {
        const endDate = subscriptionEnd
          ? new Date(subscriptionEnd).toLocaleDateString("ja-JP")
          : "";
        return `プロプラン（有効 - ${endDate}まで）`;
      } else if (subscriptionStatus === "canceled") {
        const endDate = subscriptionEnd
          ? new Date(subscriptionEnd).toLocaleDateString("ja-JP")
          : "";
        return `プロプラン（キャンセル済み - ${endDate}まで有効）`;
      } else {
        return `プロプラン（${subscriptionStatus}）`;
      }
    }

    return "フリープラン";
  };

  // プロプランかどうかの判定
  const isProPlan =
    subscription?.currentPlan === "PRO" && subscription?.isActive;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-foreground">
            アカウント情報
          </h1>

          <div className="space-y-6">
            {/* プロフィール情報 */}
            <div className="flex items-center space-x-4">
              {session?.user?.user_metadata?.avatar_url && (
                <Image
                  src={session.user.user_metadata.avatar_url}
                  alt="プロフィール画像"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  {session?.user?.user_metadata?.name || session?.user?.email}
                  {isProPlan && (
                    <div title="プロプランユーザー">
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                  )}
                </h2>
                <p className="text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>

            {/* アカウント詳細 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4 text-foreground">
                アカウント詳細
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    ユーザーID
                  </dt>
                  <dd className="mt-1 text-sm text-foreground font-mono">
                    {session?.user?.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    プラン
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      {getSubscriptionStatusDisplay()}
                      {isProPlan && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>

            {/* サブスクリプション管理 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4 text-foreground">
                サブスクリプション管理
              </h3>

              {subscription?.currentPlan === "FREE" ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-4">
                    <Crown className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        プロプランにアップグレード
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                        AI機能、無制限の学習ログ、詳細な分析機能をご利用いただけます。
                      </p>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-700"
                      >
                        <Link href="/pricing">
                          <Crown className="mr-2 h-4 w-4" />
                          プロプランを見る
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-4">
                      <Crown className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                          プロプラン有効中
                        </h4>
                        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                          AI機能と無制限の学習ログをお楽しみいただけます。
                        </p>

                        {subscription?.subscriptionStatus === "trialing" &&
                          subscription?.trialEnd && (
                            <p className="text-sm text-green-700 dark:text-green-300">
                              トライアル期間:{" "}
                              {new Date(
                                subscription.trialEnd
                              ).toLocaleDateString("ja-JP")}
                              まで
                            </p>
                          )}

                        {subscription?.subscriptionEnd && (
                          <p className="text-sm text-green-700 dark:text-green-300">
                            次回更新日:{" "}
                            {new Date(
                              subscription.subscriptionEnd
                            ).toLocaleDateString("ja-JP")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link href="/pricing">プラン詳細を見る</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
