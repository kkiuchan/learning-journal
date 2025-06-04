import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { ProfileForm } from "./components/ProfileForm";

// 動的レンダリングを強制（Cookieを使用するため）
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/supabase-login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>
      <ProfileForm />
    </div>
  );
}
