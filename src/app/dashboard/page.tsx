import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ダッシュボード",
  description: "学習の進捗状況や統計情報を確認できます。",
};

export default async function DashboardPage() {
  try {
    console.log("[Dashboard] Checking user authentication...");

    const user = await getCurrentUser();
    console.log(
      "[Dashboard] User:",
      user ? `${user.email} (${user.id})` : "None"
    );

    if (!user) {
      console.log("[Dashboard] No user found, redirecting to login");
      redirect("/auth/supabase-login");
    }

    // ユーザーのサブスクリプション情報のみを取得（ダッシュボードデータはクライアントサイドで取得）
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionStatus: true,
        subscriptionEnd: true,
        trialEnd: true,
      },
    });

    console.log("[Dashboard] User details:", userDetails);

    return (
      <DashboardClient
        subscriptionStatus={userDetails?.subscriptionStatus || null}
        subscriptionEnd={userDetails?.subscriptionEnd?.toISOString() || null}
        trialEnd={userDetails?.trialEnd?.toISOString() || null}
      />
    );
  } catch (error) {
    console.error("[Dashboard] Error:", error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          エラーが発生しました
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">
            ダッシュボードの読み込み中にエラーが発生しました。
          </p>
          <pre className="mt-2 text-sm text-red-600 overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
