import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

// 動的レンダリングを強制（Cookieを使用するため）
export const dynamic = "force-dynamic";

export default async function NewUnitPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/supabase-login");
  }

  // ユニット一覧ページにリダイレクト（モーダルで作成するため）
  redirect("/units");
}
