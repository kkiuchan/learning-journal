import { getCurrentUser } from "@/lib/auth-helpers";

export default async function DebugSessionPage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">ユーザーデバッグ</h1>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">ユーザー情報:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="mt-4 bg-blue-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">詳細分析:</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <strong>user存在:</strong> {user ? "✅" : "❌"}
          </li>
          <li>
            <strong>user.email存在:</strong> {user?.email ? "✅" : "❌"}
          </li>
          <li>
            <strong>user.email:</strong> {user?.email || "未定義"}
          </li>
          <li>
            <strong>email型:</strong> {typeof user?.email}
          </li>
          <li>
            <strong>管理者メール一致:</strong>{" "}
            {user?.email === "bandman.gh.bs.dk.lav@gmail.com" ? "✅" : "❌"}
          </li>
          <li>
            <strong>認証方法:</strong> {user?.primaryAuthMethod || "未定義"}
          </li>
          <li>
            <strong>サブスクリプション状態:</strong>{" "}
            {user?.subscriptionStatus || "未定義"}
          </li>
        </ul>
      </div>
    </div>
  );
}
