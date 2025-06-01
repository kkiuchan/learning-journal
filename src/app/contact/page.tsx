import { Metadata } from "next";
import ContactForm from "./components/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ | Learning Journal",
  description:
    "Learning Journalに関するご質問やサポートをお求めの際は、こちらからお気軽にお問い合わせください。",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          お問い合わせ
        </h1>
        <p className="text-lg text-muted-foreground">
          Learning Journalに関するご質問やサポートをお求めの際は、
          <br />
          こちらからお気軽にお問い合わせください。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* お問い合わせフォーム */}
        <div>
          <ContactForm />
        </div>

        {/* サポート情報 */}
        <div className="space-y-6">
          <div className="bg-muted/50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">サポート情報</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  返信時間について
                </h3>
                <p>
                  お問い合わせいただいた内容に対しては、通常1〜2営業日以内にご返信いたします。
                  お急ぎの場合は、お問い合わせ内容に「急用」とご記載ください。
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">
                  よくある質問
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>サブスクリプションの解約方法</li>
                  <li>データのエクスポート機能について</li>
                  <li>学習ログの編集・削除方法</li>
                  <li>支払い方法の変更について</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">
                  技術的な問題
                </h3>
                <p>
                  技術的な問題やバグを発見された場合は、
                  お使いのブラウザ、デバイス、エラーメッセージなどの詳細情報も
                  併せてお知らせください。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              アカウント情報について
            </h2>
            <p className="text-sm text-blue-700">
              アカウントに関するお問い合わせの際は、
              ログイン時のメールアドレスをお知らせください。
              より迅速なサポートを提供できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
