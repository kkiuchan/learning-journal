import { AdminClient } from "@/components/admin/admin-client";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

// 動的レンダリングを強制（Cookieを使用するため）
export const dynamic = "force-dynamic";

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
  const user = await getCurrentUser();
  console.log("=== 管理者ページデバッグ ===");
  console.log("user?.email:", user?.email);
  console.log("user全体:", JSON.stringify(user, null, 2));

  if (!user?.email) {
    console.log(
      "ユーザーまたはemailが存在しません - ログインページにリダイレクト"
    );
    redirect("/auth/supabase-login");
  }

  const adminResult = await isCurrentUserAdmin();
  console.log("isCurrentUserAdmin結果:", adminResult);
  console.log("チェック対象メール:", user.email);

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
          ログイン中: {user.email}
        </p>
      </div>

      <AdminClient />
    </div>
  );
}
