import { AuthCard } from "../components/AuthCard";
import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard title="ログイン">
      <LoginForm />
    </AuthCard>
  );
}
