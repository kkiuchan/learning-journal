import { PricingClient } from "./components/PricingClient";

export const metadata = {
  title: "料金プラン",
  description: "Learning Journalの料金プランをご確認ください。",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <PricingClient />
    </div>
  );
}
