import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function NewUnitPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/supabase-login");
  }

  // ユニット一覧ページにリダイレクト（モーダルで作成するため）
  redirect("/units");
}
