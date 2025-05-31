"use client";

import { Button } from "@/components/ui/button";
import { Clock, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TrialBannerProps {
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  trialEnd: string | null;
}

export function TrialBanner({
  subscriptionStatus,
  subscriptionEnd,
  trialEnd,
}: TrialBannerProps) {
  const router = useRouter();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (subscriptionStatus === "trialing") {
      const endDate = new Date(trialEnd || subscriptionEnd || "");
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    }
  }, [subscriptionStatus, subscriptionEnd, trialEnd]);

  if (subscriptionStatus !== "trialing" || daysRemaining === null) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              プロプラン無料トライアル中
            </h3>
            <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
              <Clock className="w-4 h-4" />
              <span>残り{daysRemaining}日でトライアル期間が終了します</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/pricing")}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            プラン詳細
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/pricing")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            続行する
          </Button>
        </div>
      </div>
    </div>
  );
}
