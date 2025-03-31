"use client";

import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const checkPassword = async () => {
      try {
        const response = await fetch("/api/auth/check-password");
        const data = await response.json();
        setHasPassword(data.data.hasPassword);
      } catch (error) {
        console.error("パスワード確認エラー:", error);
      }
    };

    if (status === "authenticated") {
      checkPassword();
    }
  }, [status]);

  if (status === "loading" || hasPassword === null) {
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
                <Image
                  src={session.user.image}
                  alt="プロフィール画像"
                  width={80}
                  height={80}
                  className="rounded-full"
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

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              認証方法の設定
            </h2>
            <div className="space-y-4">
              {/* アカウント連携セクション */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  アカウント連携
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  外部認証アカウントとメール/パスワード認証を連携できます。連携後は両方の認証方法でログインできるようになります。
                </p>

                {/* 現在の認証方法の表示 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    現在の認証方法
                  </h4>
                  <div className="space-y-2">
                    {session?.user?.primaryAuthMethod === "email" && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-gray-400 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            メール/パスワード認証
                          </span>
                        </div>
                        <span className="text-xs text-green-600 font-medium">
                          連携済み
                        </span>
                      </div>
                    )}
                    {session?.user?.accounts?.map((account) => (
                      <div
                        key={account.provider}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center">
                          {account.provider === "google" && (
                            <svg
                              className="h-5 w-5 text-gray-400 mr-2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                              />
                            </svg>
                          )}
                          {account.provider === "github" && (
                            <svg
                              className="h-5 w-5 text-gray-400 mr-2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.239 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                              />
                            </svg>
                          )}
                          {account.provider === "discord" && (
                            <svg
                              className="h-5 w-5 text-gray-400 mr-2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                              />
                            </svg>
                          )}
                          <span className="text-sm text-gray-600 capitalize">
                            {account.provider}認証
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 font-medium">
                            連携済み
                          </span>
                          {session?.user?.accounts?.length > 1 && (
                            <form
                              action="/api/auth/unlink-account"
                              method="POST"
                              className="inline"
                            >
                              <input
                                type="hidden"
                                name="provider"
                                value={account.provider}
                              />
                              <button
                                type="submit"
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                連携解除
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* パスワード認証の追加フォーム */}
                {!hasPassword ? (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      パスワード認証の追加
                    </h4>
                    <form
                      action="/api/auth/link-account"
                      method="POST"
                      className="space-y-4"
                    >
                      <input
                        type="hidden"
                        name="email"
                        value={session?.user?.email}
                      />
                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          パスワード
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          パスワード（確認）
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          minLength={8}
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        パスワード認証を追加
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      パスワードの変更
                    </h4>
                    <form
                      action="/api/auth/link-account"
                      method="POST"
                      className="space-y-4"
                    >
                      <input
                        type="hidden"
                        name="email"
                        value={session?.user?.email}
                      />
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          現在のパスワード
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          新しいパスワード
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          新しいパスワード（確認）
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          minLength={8}
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        パスワードを変更
                      </button>
                    </form>
                  </div>
                )}

                {/* 外部認証の追加 */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    外部認証の追加
                  </h4>
                  <div className="space-y-2">
                    {!session?.user?.accounts?.some(
                      (acc) => acc.provider === "google"
                    ) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          signIn("google", { callbackUrl: "/account" })
                        }
                      >
                        Googleアカウントを連携
                      </Button>
                    )}
                    {!session?.user?.accounts?.some(
                      (acc) => acc.provider === "github"
                    ) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          signIn("github", { callbackUrl: "/account" })
                        }
                      >
                        GitHubアカウントを連携
                      </Button>
                    )}
                    {!session?.user?.accounts?.some(
                      (acc) => acc.provider === "discord"
                    ) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          signIn("discord", { callbackUrl: "/account" })
                        }
                      >
                        Discordアカウントを連携
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
