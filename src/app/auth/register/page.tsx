import { AuthCard } from "../components/AuthCard";
import { RegisterForm } from "./components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <AuthCard title="アカウント登録">
        <RegisterForm />
      </AuthCard>
    </div>
  );
}
