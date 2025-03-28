"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">アカウント情報</h1>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt="プロフィール画像"
                  className="w-20 h-20 rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
                <p className="text-gray-600">{session?.user?.email}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">アカウント詳細</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ユーザーID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {session?.user?.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    認証方法
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {session?.user?.primaryAuthMethod || "不明"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    サブスクリプション状態
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {session?.user?.subscriptionStatus || "未設定"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
