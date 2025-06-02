import { authConfig } from "@/auth.config";
import { getServerSession } from "next-auth";
import { UnitsPageClient } from "./components/UnitsPageClient";

export default async function UnitsPage() {
  const session = await getServerSession(authConfig);

  return <UnitsPageClient session={session} />;
}
