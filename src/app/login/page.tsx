"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setAvailableProviders([]);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        try {
          const errorData = JSON.parse(result.error);
          if (errorData.availableProviders) {
            setAvailableProviders(errorData.availableProviders);
            setError(
              "このメールアドレスは外部認証で登録されています。以下の方法でログインしてください。"
            );
          } else {
            setError("メールアドレスまたはパスワードが正しくありません。");
          }
        } catch {
          setError("メールアドレスまたはパスワードが正しくありません。");
        }
      } else {
        router.push("/account");
      }
    } catch {
      setError("ログイン中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにログイン
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                type="button"
                variant="outline"
                className={`w-full ${
                  availableProviders.includes("google")
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => signIn("google", { callbackUrl: "/account" })}
              >
                Googleでログイン
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`w-full ${
                  availableProviders.includes("github")
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => signIn("github", { callbackUrl: "/account" })}
              >
                GitHubでログイン
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`w-full ${
                  availableProviders.includes("discord")
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => signIn("discord", { callbackUrl: "/account" })}
              >
                Discordでログイン
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
