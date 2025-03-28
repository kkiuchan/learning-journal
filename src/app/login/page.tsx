"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomSignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const router = useRouter();

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugInfo("認証開始...");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/account",
    });
    if (res?.error) {
      setErrorMsg("サインインに失敗しました。入力情報を確認してください。");
      setDebugInfo(`エラー: ${res.error}`);
    } else {
      setDebugInfo("認証成功、リダイレクト中...");
      router.push(res?.url || "/account");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setDebugInfo("Google認証開始...");
      const result = await signIn("google", {
        redirect: true,
        callbackUrl: "/account",
      });

      if (result?.error) {
        setErrorMsg("Google認証に失敗しました。");
        setDebugInfo(`エラー: ${result.error}`);
      } else if (result?.url) {
        setDebugInfo("認証成功、リダイレクト中...");
        router.push(result.url);
      }
    } catch (error) {
      setErrorMsg("予期せぬエラーが発生しました。");
      setDebugInfo(
        `エラー: ${error instanceof Error ? error.message : "不明なエラー"}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">サインイン</h1>
        {errorMsg && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 text-center">
            {errorMsg}
          </div>
        )}
        {debugInfo && (
          <div className="mb-4 p-2 bg-gray-100 text-gray-700 text-center text-sm">
            {debugInfo}
          </div>
        )}
        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="your@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="********"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
          >
            サインイン
          </button>
        </form>
        <div className="mt-6 border-t pt-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center border rounded py-2 hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign In with Google
          </button>
        </div>
      </div>
    </div>
  );
}
