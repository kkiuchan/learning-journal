import { getCurrentUser } from "@/lib/auth-helpers";
import { UnitsPageClient } from "./components/UnitsPageClient";

export default async function UnitsPage() {
  const user = await getCurrentUser();

  return <UnitsPageClient user={user} />;
}
