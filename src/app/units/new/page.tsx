import { authConfig } from "@/auth.config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function NewUnitPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/login");
  }

  // ユニット一覧ページにリダイレクト（モーダルで作成するため）
  redirect("/units");
}
