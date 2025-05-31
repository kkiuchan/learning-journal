import { authConfig } from "@/auth.config";
import { AdminClient } from "@/components/admin/admin-client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// 管理者権限チェック
function isAdmin(email: string): boolean {
  const adminEmails = [
    "bandman.gh.bs.dk.lav@gmail.com", // あなたのメールアドレス
    // "friend@example.com", // 知人のメールアドレス（例）
    // "admin@company.com", // 会社の管理者（例）
    // 他の管理者のメールアドレスをここに追加
  ];

  console.log("=== isAdmin関数デバッグ ===");
  console.log("チェック対象email:", email);
  console.log("管理者メールリスト:", adminEmails);
  console.log("includes結果:", adminEmails.includes(email));
  console.log("email型:", typeof email);

  return adminEmails.includes(email);
}

export default async function AdminPage() {
  const session = await getServerSession(authConfig);
  console.log("=== 管理者ページデバッグ ===");
  console.log("session?.user?.email:", session?.user?.email);
  console.log("session全体:", JSON.stringify(session, null, 2));

  if (!session?.user?.email) {
    console.log(
      "セッションまたはemailが存在しません - ログインページにリダイレクト"
    );
    redirect("/auth/login");
  }

  const userEmail = session.user.email;
  const adminResult = isAdmin(userEmail);
  console.log("isAdmin結果:", adminResult);
  console.log("チェック対象メール:", userEmail);

  if (!adminResult) {
    console.log("管理者権限なし - ダッシュボードにリダイレクト");
    redirect("/dashboard");
  }

  console.log("管理者権限確認済み - 管理者パネル表示");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">管理者パネル</h1>
        <p className="text-muted-foreground mt-2">
          ユーザーのライフタイムプロプラン管理
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ログイン中: {userEmail}
        </p>
      </div>

      <AdminClient />
    </div>
  );
}
