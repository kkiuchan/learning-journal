import { authConfig } from "@/auth.config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NewUnitClient } from "./components/NewUnitClient";

export default async function NewUnitPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/login");
  }

  return <NewUnitClient />;
}
