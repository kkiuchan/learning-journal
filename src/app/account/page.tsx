import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { AccountClient } from "./components/AccountClient";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/supabase-login");
  }

  return <AccountClient />;
}
