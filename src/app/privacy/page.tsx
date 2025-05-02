import { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "Learning Journalのプライバシーポリシーについて説明します。",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">プライバシーポリシー</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. 個人情報の取り扱いについて
          </h2>
          <p className="mb-4">
            Learning
            Journal（以下、「当サービス」）は、ユーザーの個人情報を適切に取り扱うことが重要な責務であると考えています。
            当サービスは、以下の方針に従って個人情報を取り扱います。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 収集する情報</h2>
          <p className="mb-4">当サービスが収集する情報は以下の通りです：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>アカウント情報（ユーザー名、メールアドレス等）</li>
            <li>プロフィール情報（任意で登録される情報）</li>
            <li>学習記録データ</li>
            <li>利用状況データ（アクセスログ等）</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 情報の利用目的</h2>
          <p className="mb-4">収集した情報は、以下の目的で利用されます：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>サービスの提供・運営</li>
            <li>ユーザーサポート</li>
            <li>サービスの改善・新機能の開発</li>
            <li>利用状況の分析</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. 情報の管理</h2>
          <p className="mb-4">
            当サービスは、収集した個人情報の漏洩、紛失、改ざん等を防ぐため、
            適切なセキュリティ対策を実施しています。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. 情報の第三者提供</h2>
          <p className="mb-4">
            当サービスは、以下の場合を除き、収集した個人情報を第三者に提供しません：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. お問い合わせ</h2>
          <p className="mb-4">
            プライバシーポリシーに関するお問い合わせは、
            <a href="/contact" className="text-primary hover:underline">
              お問い合わせフォーム
            </a>
            よりご連絡ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. 改定について</h2>
          <p className="mb-4">
            当サービスは、必要に応じて本プライバシーポリシーを改定することがあります。
            重要な変更がある場合は、サービス上で通知します。
          </p>
        </section>

        <div className="text-sm text-muted-foreground mt-8">
          最終更新日: 2024年3月20日
        </div>
      </div>
    </div>
  );
}
