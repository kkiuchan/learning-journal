"use client";

import {
  checkEmailExists,
  generateAuthConflictMessage,
  getProviderDisplayName,
} from "@/lib/auth-validation";
import { signInWithOAuth, signUpWithPassword } from "@/lib/supabase-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ConflictInfo {
  exists: boolean;
  availableProviders: string[];
  primaryAuthMethod?: string;
}

export default function SupabaseRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState<
    "none" | "available" | "conflict"
  >("none");

  const handleEmailBlur = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailCheckStatus("none");
      setConflictInfo(null);
      setError(null);
      return;
    }

    setIsCheckingEmail(true);
    setError(null);

    try {
      const checkResult = await checkEmailExists(email);

      if (checkResult.exists) {
        // すでにアカウントが存在する場合
        setConflictInfo(checkResult);
        setEmailCheckStatus("conflict");
        setError(
          generateAuthConflictMessage(
            "register",
            checkResult.availableProviders
          )
        );
      } else {
        setConflictInfo(null);
        setEmailCheckStatus("available");
        setError(null);
      }
    } catch (error) {
      console.error("Email check failed:", error);
      setEmailCheckStatus("none");
      // エラーは無視して続行
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("email");
    setError(null);

    try {
      const email = emailValue.trim();
      const password = passwordValue;
      const confirmPassword = confirmPasswordValue;
      const name = nameValue.trim();

      // 事前チェック
      const checkResult = await checkEmailExists(email);

      if (checkResult.exists) {
        setConflictInfo(checkResult);
        setEmailCheckStatus("conflict");
        setError(
          generateAuthConflictMessage(
            "register",
            checkResult.availableProviders
          )
        );
        return;
      }

      if (password !== confirmPassword) {
        setError("パスワードが一致しません");
        return;
      }

      if (password.length < 8) {
        setError("パスワードは8文字以上で入力してください");
        return;
      }

      const { data, error } = await signUpWithPassword(email, password, {
        name,
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          // 既存ユーザーの場合、再度チェックして詳細な案内を表示
          try {
            const recheckResult = await checkEmailExists(email);
            if (recheckResult.exists) {
              setConflictInfo(recheckResult);
              setEmailCheckStatus("conflict");
              setError(
                generateAuthConflictMessage(
                  "register",
                  recheckResult.availableProviders
                )
              );
            } else {
              setError("このメールアドレスは既に登録されています");
            }
          } catch {
            setError("このメールアドレスは既に登録されています");
          }
        } else if (error.message.includes("Password should be at least")) {
          setError("パスワードは8文字以上で入力してください");
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.user) {
        toast.success(
          "確認メールを送信しました。メールを確認してアカウントを有効化してください。"
        );
        router.push(`/auth/verify-notice?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error("Email register error:", error);
      setError("登録中にエラーが発生しました");
    } finally {
      setLoading(null);
    }
  };

  const handleOAuthLogin = async (
    provider: "google" | "github" | "discord"
  ) => {
    try {
      setLoading(provider);
      setError(null);

      const { error } = await signInWithOAuth(provider);

      if (error) {
        throw error;
      }

      // OAuth認証が成功した場合、ページ遷移は自動的に行われる
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setError(
        error instanceof Error
          ? error.message
          : `${provider}認証でエラーが発生しました`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            学習ジャーナルに登録
          </h1>
          <p className="text-gray-600">新しいアカウントを作成してください</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-red-600 text-sm font-medium">{error}</p>
                {conflictInfo && conflictInfo.availableProviders.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm text-gray-600 mb-3 font-medium">
                      このメールアドレスで既にアカウントが存在します：
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {conflictInfo.availableProviders.map((provider) => (
                        <span
                          key={provider}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {getProviderDisplayName(provider)}
                        </span>
                      ))}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>💡 解決方法：</strong>
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 既存のアカウントでログインしてください</li>
                        <li>• 別のメールアドレスで新規登録してください</li>
                      </ul>
                      <div className="mt-3">
                        <Link
                          href="/auth/supabase-login"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                          </svg>
                          ログインページに移動
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 成功メッセージ */}
        {emailCheckStatus === "available" && emailValue && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-600 text-sm font-medium">
                  ✅ このメールアドレスは利用可能です
                </p>
              </div>
            </div>
          </div>
        )}

        {/* メール/パスワード登録 */}
        <form onSubmit={handleEmailRegister} className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              お名前
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              disabled={loading !== null}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                onBlur={(e) => handleEmailBlur(e.target.value)}
                disabled={loading !== null}
                className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  emailCheckStatus === "conflict"
                    ? "border-red-300"
                    : emailCheckStatus === "available"
                      ? "border-green-300"
                      : "border-gray-300"
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isCheckingEmail ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                ) : emailCheckStatus === "available" ? (
                  <svg
                    className="h-4 w-4 text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : emailCheckStatus === "conflict" ? (
                  <svg
                    className="h-4 w-4 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              パスワード（8文字以上）
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              disabled={loading !== null}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPasswordValue}
              onChange={(e) => setConfirmPasswordValue(e.target.value)}
              disabled={loading !== null}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading !== null || conflictInfo?.exists}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading === "email" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              "アカウント作成"
            )}
          </button>
        </form>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{" "}
            <Link
              href="/auth/supabase-login"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              こちら
            </Link>
          </p>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Google認証 */}
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "google" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleで登録
              </>
            )}
          </button>

          {/* GitHub認証 */}
          <button
            onClick={() => handleOAuthLogin("github")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "github" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHubで登録
              </>
            )}
          </button>

          {/* Discord認証 */}
          <button
            onClick={() => handleOAuthLogin("discord")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "discord" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-3"
                  fill="#7289DA"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0188 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
                </svg>
                Discordで登録
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
