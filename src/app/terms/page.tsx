import { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "Learning Journalの利用規約について説明します。",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">利用規約</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. はじめに</h2>
          <p className="mb-4">
            本利用規約（以下、「本規約」）は、Learning
            Journal（以下、「当サービス」）の
            利用条件を定めるものです。ユーザーの皆様には、本規約に従って当サービスをご利用いただきます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 利用登録</h2>
          <p className="mb-4">
            当サービスの利用を希望する方は、本規約に同意の上、当サービスの定める方法によって
            利用登録を行う必要があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 禁止事項</h2>
          <p className="mb-4">ユーザーは、以下の行為をしてはなりません：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>
              当サービスのサーバーまたはネットワークの機能を破壊、妨害する行為
            </li>
            <li>当サービスの運営を妨害する行為</li>
            <li>他のユーザーに迷惑をかける行為</li>
            <li>他のユーザーの情報を収集する行為</li>
            <li>反社会的勢力に関与する行為</li>
            <li>その他、当サービスが不適切と判断する行為</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. サービスの提供の停止等
          </h2>
          <p className="mb-4">
            当サービスは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく
            本サービスの全部または一部の提供を停止または中断することができるものとします：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>システムの保守点検または更新を行う場合</li>
            <li>
              地震、落雷、火災、停電、天災などの不可抗力により、本サービスの提供が困難となった場合
            </li>
            <li>コンピュータまたは通信回線等が事故により停止した場合</li>
            <li>その他、当サービスの提供が困難と判断した場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. 免責事項</h2>
          <p className="mb-4">
            当サービスは、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、
            連絡または紛争等について一切責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            6. サービス内容の変更等
          </h2>
          <p className="mb-4">
            当サービスは、ユーザーに通知することなく、本サービスの内容を変更または本サービスの提供を中止することができるものとし、
            これによってユーザーに生じた損害について一切の責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. 利用規約の変更</h2>
          <p className="mb-4">
            当サービスは、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。
            変更後の利用規約は、当サービス上に表示した時点で効力を生じるものとします。
          </p>
        </section>

        <div className="text-sm text-muted-foreground mt-8">
          最終更新日: 2024年3月20日
        </div>
      </div>
    </div>
  );
}
