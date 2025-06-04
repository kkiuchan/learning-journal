"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";
import { AuthSession } from "@/types/auth";
import { Check, Crown, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface SubscriptionInfo {
  currentPlan: "FREE" | "PRO";
  isActive: boolean;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  trialEnd: string | null;
  isLifetime: boolean;
  hasStripeSubscription: boolean;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  willCancelAtPeriodEnd?: boolean;
}

export function PricingClient() {
  const { session: supabaseSession } = useSupabaseAuth();

  // Supabaseセッションを NextAuth.js 互換形式に変換（useMemoで最適化）
  const session: AuthSession | null = useMemo(() => {
    if (!supabaseSession) return null;

    return {
      user: {
        id: supabaseSession.user.id,
        email: supabaseSession.user.email || "",
        name:
          supabaseSession.user.user_metadata?.name ||
          supabaseSession.user.user_metadata?.full_name ||
          "",
        image:
          supabaseSession.user.user_metadata?.avatar_url ||
          supabaseSession.user.user_metadata?.picture ||
          "",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }, [
    supabaseSession?.user?.id,
    supabaseSession?.user?.email,
    supabaseSession?.user?.user_metadata?.name,
    supabaseSession?.user?.user_metadata?.full_name,
    supabaseSession?.user?.user_metadata?.avatar_url,
    supabaseSession?.user?.user_metadata?.picture,
  ]);

  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // サブスクリプション情報を取得（useCallbackで最適化）
  const fetchSubscriptionInfo = useCallback(async () => {
    if (!supabaseSession?.access_token) {
      setLoadingSubscription(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${supabaseSession.access_token}`,
      };

      const response = await fetch("/api/auth/user/subscription", { headers });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubscriptionInfo(data.data);
        }
      }
    } catch (error) {
      console.error("サブスクリプション情報取得エラー:", error);
    } finally {
      setLoadingSubscription(false);
    }
  }, [supabaseSession?.access_token]);

  // ユーザーIDが変更された時のみサブスクリプション情報を取得
  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptionInfo();
    } else {
      setLoadingSubscription(false);
      setSubscriptionInfo(null);
    }
  }, [session?.user?.id, fetchSubscriptionInfo]);

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push("/auth/supabase-login");
      return;
    }

    // 無料プランの場合の処理を改善
    if (planId === "FREE") {
      const isCurrentlyPro =
        subscriptionInfo?.currentPlan === "PRO" && subscriptionInfo?.isActive;

      if (isCurrentlyPro) {
        // プロプランユーザーが無料プランに戻る場合
        const confirmed = window.confirm(
          "プロプランを解約しますか？\n解約後も課金期間の終了まではプロ機能をご利用いただけます。"
        );

        if (!confirmed) return;

        // Customer Portalにリダイレクト
        setLoading("cancel");
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          // Supabaseセッションのアクセストークンを追加
          if (supabaseSession?.access_token) {
            headers["Authorization"] = `Bearer ${supabaseSession.access_token}`;
          }

          const response = await fetch("/api/stripe/create-portal-session", {
            method: "POST",
            headers,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "エラーが発生しました");
          }

          window.location.href = data.data.url;
        } catch (error) {
          console.error("カスタマーポータルエラー:", error);
          toast.error("カスタマーポータルへのアクセスに失敗しました");
          setLoading(null);
        }
        return;
      } else {
        // 既に無料プランの場合
        toast.info("現在無料プランをご利用中です");
        return;
      }
    }

    setLoading(planId);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Supabaseセッションのアクセストークンを追加
      if (supabaseSession?.access_token) {
        headers["Authorization"] = `Bearer ${supabaseSession.access_token}`;
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      // Stripeチェックアウトページにリダイレクト
      window.location.href = data.data.url;
    } catch (error) {
      console.error("サブスクリプションエラー:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "サブスクリプションの作成に失敗しました"
      );
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("manage");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Supabaseセッションのアクセストークンを追加
      if (supabaseSession?.access_token) {
        headers["Authorization"] = `Bearer ${supabaseSession.access_token}`;
      }

      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      // Stripe Customer Portalにリダイレクト
      window.location.href = data.data.url;
    } catch (error) {
      console.error("カスタマーポータルエラー:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "カスタマーポータルへのアクセスに失敗しました"
      );
    } finally {
      setLoading(null);
    }
  };

  const renderActionButton = (planId: "FREE" | "PRO") => {
    if (!session) {
      return (
        <Button
          className="w-full"
          variant={planId === "PRO" ? "default" : "outline"}
          onClick={() => router.push("/auth/supabase-login")}
        >
          ログインして開始
        </Button>
      );
    }

    if (loadingSubscription) {
      return (
        <Button className="w-full" disabled>
          読み込み中...
        </Button>
      );
    }

    const isCurrentPlan = subscriptionInfo?.currentPlan === planId;
    const isProActive =
      subscriptionInfo?.currentPlan === "PRO" && subscriptionInfo?.isActive;
    const isLifetime = subscriptionInfo?.isLifetime;
    const isCancelScheduled =
      subscriptionInfo?.cancelAtPeriodEnd ||
      subscriptionInfo?.willCancelAtPeriodEnd;
    const isTrialing = subscriptionInfo?.subscriptionStatus === "trialing";

    if (planId === "FREE") {
      if (isCurrentPlan && !isProActive) {
        return (
          <Button className="w-full" variant="outline" disabled>
            現在のプラン
          </Button>
        );
      } else if (isProActive) {
        return (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => handleSubscribe(planId)}
            disabled={loading !== null}
          >
            {loading === "cancel" ? "処理中..." : "無料プランに戻る"}
          </Button>
        );
      }
      // 未ログインまたは未登録の場合
      return (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => router.push("/auth/supabase-login")}
        >
          無料で始める
        </Button>
      );
    }

    // PRO プランの場合
    if (isCurrentPlan && isProActive) {
      if (isLifetime) {
        return (
          <Button className="w-full" variant="outline" disabled>
            ライフタイムプラン
          </Button>
        );
      } else if (isCancelScheduled) {
        return (
          <Button
            className="w-full"
            variant="default"
            onClick={() => handleSubscribe(planId)}
            disabled={loading !== null}
          >
            {loading === planId ? "処理中..." : "再購読する"}
          </Button>
        );
      } else {
        return (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleManageSubscription}
            disabled={loading !== null}
          >
            {loading === "manage" ? "処理中..." : "管理"}
          </Button>
        );
      }
    }

    // プロプランではない場合、またはアクティブでない場合
    return (
      <Button
        className="w-full"
        variant="default"
        onClick={() => handleSubscribe(planId)}
        disabled={loading !== null}
      >
        {loading === planId
          ? "処理中..."
          : isTrialing
            ? "プロプランに変更"
            : "プロプランを始める"}
      </Button>
    );
  };

  const getCurrentPlanBadge = (planId: "FREE" | "PRO") => {
    if (!session || loadingSubscription) return null;

    const isCurrentPlan = subscriptionInfo?.currentPlan === planId;
    const isProActive =
      subscriptionInfo?.currentPlan === "PRO" && subscriptionInfo?.isActive;
    const isLifetime = subscriptionInfo?.isLifetime;
    const isCancelScheduled =
      subscriptionInfo?.cancelAtPeriodEnd ||
      subscriptionInfo?.willCancelAtPeriodEnd;
    const isTrialing = subscriptionInfo?.subscriptionStatus === "trialing";

    if (planId === "FREE" && isCurrentPlan && !isProActive && !isLifetime) {
      return (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            現在のプラン
          </div>
        </div>
      );
    }

    if (planId === "PRO" && isCurrentPlan && (isProActive || isLifetime)) {
      // キャンセル予約済みの場合は色を変更
      const badgeColor = isLifetime
        ? "bg-purple-500"
        : isCancelScheduled
          ? "bg-orange-500"
          : "bg-green-500";

      const badgeText = isLifetime
        ? "ライフタイムプロ"
        : isCancelScheduled
          ? isTrialing
            ? "トライアル中 (解約予約済み)"
            : "解約予約済み"
          : "現在のプラン";

      return (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div
            className={`${badgeColor} text-white px-4 py-1 rounded-full text-sm font-medium`}
          >
            {badgeText}
          </div>
        </div>
      );
    }

    if (planId === "PRO" && (!isCurrentPlan || (!isProActive && !isLifetime))) {
      return (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            おすすめ
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          料金プラン
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          あなたの学習スタイルに合わせたプランをお選びください。
          いつでもプランの変更が可能です。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* 無料プラン */}
        <Card className="relative border-2 border-border">
          {getCurrentPlanBadge("FREE")}

          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">
              {SUBSCRIPTION_PLANS.FREE.name}
            </CardTitle>
            <CardDescription>
              {SUBSCRIPTION_PLANS.FREE.description}
            </CardDescription>
            <div className="text-4xl font-bold text-foreground mt-4">
              ¥{SUBSCRIPTION_PLANS.FREE.price.toLocaleString()}
              <span className="text-lg font-normal text-muted-foreground">
                /月
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {SUBSCRIPTION_PLANS.FREE.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </CardContent>

          <CardFooter>{renderActionButton("FREE")}</CardFooter>
        </Card>

        {/* プロプラン */}
        <Card className="relative border-2 border-primary shadow-lg">
          {getCurrentPlanBadge("PRO")}

          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {SUBSCRIPTION_PLANS.PRO.name}
            </CardTitle>
            <CardDescription>
              {SUBSCRIPTION_PLANS.PRO.description}
            </CardDescription>
            <div className="text-4xl font-bold text-foreground mt-4">
              ¥{SUBSCRIPTION_PLANS.PRO.price.toLocaleString()}
              <span className="text-lg font-normal text-muted-foreground">
                /月
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {subscriptionInfo?.trialEnd !== null
                ? "※ トライアルは一度きりのため、即座に課金が開始されます"
                : "最初の7日間は無料でお試しいただけます"}
            </div>

            {/* 解約予約状態の表示 */}
            {subscriptionInfo?.willCancelAtPeriodEnd && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                  ⚠️ 解約予約済み
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {subscriptionInfo.subscriptionStatus === "trialing" ? (
                    <>
                      トライアル期間終了時（
                      {subscriptionInfo.subscriptionEnd &&
                        new Date(
                          subscriptionInfo.subscriptionEnd
                        ).toLocaleDateString("ja-JP")}
                      ）に自動的に無料プランに戻ります
                    </>
                  ) : (
                    <>
                      {subscriptionInfo.subscriptionEnd &&
                        `${new Date(subscriptionInfo.subscriptionEnd).toLocaleDateString("ja-JP")} に自動解約されます`}
                    </>
                  )}
                </div>
                {subscriptionInfo.subscriptionStatus === "trialing" && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    💡 プラン管理から解約予約を取り消すことも可能です
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {SUBSCRIPTION_PLANS.PRO.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </CardContent>

          <CardFooter>{renderActionButton("PRO")}</CardFooter>
        </Card>
      </div>

      {/* 特定商取引法に基づく表示へのリンク */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          決済に関する詳細は{" "}
          <a
            href="/legal"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            特定商取引法に基づく表示
          </a>{" "}
          をご確認ください
        </p>
      </div>

      {/* よくある質問 */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">よくある質問</h2>
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              プランの変更はいつでもできますか？
            </h3>
            <p className="text-muted-foreground">
              はい、いつでもプランの変更が可能です。アップグレードは即座に適用され、
              ダウングレードは次回の請求日から適用されます。
            </p>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              無料プランから有料プランにアップグレードする際、データは引き継がれますか？
            </h3>
            <p className="text-muted-foreground">
              はい、すべての学習データは引き継がれます。安心してアップグレードしてください。
            </p>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              7日間の無料トライアルはどのような内容ですか？
            </h3>
            <p className="text-muted-foreground">
              プロプランのすべての機能を7日間無料でお試しいただけます。
              トライアル期間中はAI機能などのプロプラン限定機能をご利用できます。
              <strong>
                トライアル期間終了後は自動的にプロプラン（月額680円）が開始されます。
              </strong>
              継続しない場合は、トライアル期間中にキャンセルしてください。
            </p>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">
              トライアル期間中にキャンセルするにはどうすればいいですか？
            </h3>
            <p className="text-muted-foreground">
              プランページから「プラン管理」ボタンをクリックして、Stripeのカスタマーポータルでサブスクリプションをキャンセルできます。
              キャンセル後もトライアル期間終了まではプロプラン機能をご利用いただけます。
            </p>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">支払い方法は何がありますか？</h3>
            <p className="text-muted-foreground">
              クレジットカード（Visa、Mastercard、American
              Express、JCB）に対応しています。
              決済はStripeを通じて安全に処理されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
