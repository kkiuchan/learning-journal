"use client";

import { ErrorMessage } from "@/components/ui/error-message";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
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
    const name = formData.get("name") as string;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登録中にエラーが発生しました");
      }

      // 登録成功後、ログインページにリダイレクト
      router.push("/auth/login?registered=true");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "登録中にエラーが発生しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} />}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          お名前
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input sm:text-sm bg-background"
          />
        </div>
      </div>

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
            autoComplete="new-password"
            required
            minLength={8}
            className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input sm:text-sm bg-background"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            8文字以上のパスワードを設定してください
          </p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
        >
          {isLoading ? "登録中..." : "登録"}
        </button>
      </div>

      <div className="text-sm text-center">
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:text-primary/90"
        >
          すでにアカウントをお持ちの方はこちら
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
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
              availableProviders.includes("google")
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-foreground hover:bg-accent"
            } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
          >
            Googleでアカウント作成
          </button>
          <button
            type="button"
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
              availableProviders.includes("github")
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-foreground hover:bg-accent"
            } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
          >
            GitHubでアカウント作成
          </button>
          <button
            type="button"
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
              availableProviders.includes("discord")
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-foreground hover:bg-accent"
            } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
          >
            Discordでアカウント作成
          </button>
        </div>
      </div>
    </form>
  );
}
