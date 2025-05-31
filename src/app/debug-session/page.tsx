import { authConfig } from "@/auth.config";
import { getServerSession } from "next-auth";

export default async function DebugSessionPage() {
  const session = await getServerSession(authConfig);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">セッションデバッグ</h1>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">セッション情報:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="mt-4 bg-blue-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">詳細分析:</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <strong>session存在:</strong> {session ? "✅" : "❌"}
          </li>
          <li>
            <strong>session.user存在:</strong> {session?.user ? "✅" : "❌"}
          </li>
          <li>
            <strong>session.user.email:</strong>{" "}
            {session?.user?.email || "未定義"}
          </li>
          <li>
            <strong>email型:</strong> {typeof session?.user?.email}
          </li>
          <li>
            <strong>管理者メール一致:</strong>{" "}
            {session?.user?.email === "bandman.gh.bs.dk.lav@gmail.com"
              ? "✅"
              : "❌"}
          </li>
        </ul>
      </div>
    </div>
  );
}
