import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { AccountClient } from "./components/AccountClient";

// 動的レンダリングを強制（Cookieを使用するため）
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUserUnified();

  if (!user) {
    redirect("/auth/supabase-login");
  }

  return <AccountClient />;
}
