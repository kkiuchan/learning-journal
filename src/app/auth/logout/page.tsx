import { AuthCard } from "../components/AuthCard";
import { LogoutForm } from "./components/LogoutForm";

export const metadata = {
  title: "ログアウト",
  description: "アカウントからログアウトします",
};

export default function LogoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-0 px-4 sm:px-6 lg:px-8">
      <AuthCard title="ログアウト">
        <LogoutForm />
      </AuthCard>
    </div>
  );
}
