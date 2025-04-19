"use client";

import { ErrorMessage } from "@/components/ui/error-message";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setAvailableProviders([]);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

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
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} />}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          メールアドレス
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input sm:text-sm bg-background"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          パスワード
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input sm:text-sm bg-background"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </div>

      <div className="text-sm text-center">
        <Link
          href="/auth/register"
          className="font-medium text-primary hover:text-primary/90"
        >
          アカウントをお持ちでない方はこちら
        </Link>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">または</span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/account" })}
            className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
              availableProviders.includes("google")
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-foreground hover:bg-accent"
            } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
          >
            Googleでログイン
          </button>
          <button
            type="button"
            onClick={() => signIn("github", { callbackUrl: "/account" })}
            className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
              availableProviders.includes("github")
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-foreground hover:bg-accent"
            } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
          >
            GitHubでログイン
          </button>
          <button
            type="button"
            onClick={() => signIn("discord", { callbackUrl: "/account" })}
            className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
              availableProviders.includes("discord")
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-foreground hover:bg-accent"
            } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
          >
            Discordでログイン
          </button>
        </div>
      </div>
    </form>
  );
}
