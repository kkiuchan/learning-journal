import { authConfig } from "@/auth.config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AccountClient } from "./components/AccountClient";

export default async function AccountPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/login");
  }

  return <AccountClient />;
}
