import { AuthCard } from "../components/AuthCard";
import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-0 px-4 sm:px-6 lg:px-8">
      <AuthCard title="ログイン">
        <LoginForm />
      </AuthCard>
    </div>
  );
}
