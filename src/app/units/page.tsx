import { getCurrentUser } from "@/lib/auth-helpers";
import { UnitsPageClient } from "./components/UnitsPageClient";

// 動的レンダリングを強制（Cookieを使用するため）
export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const user = await getCurrentUser();

  return <UnitsPageClient user={user} />;
}
