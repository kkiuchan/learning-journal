import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表示 | Learning Journal",
  description:
    "Learning Journalサービスの特定商取引法に基づく表示ページです。事業者情報、料金、支払い方法、解約・返金について記載しています。",
};

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">特定商取引法に基づく表示</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>事業者情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">
                事業者の氏名（名称）
              </h3>
              <p>Learning Journal 運営事務局</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">所在地</h3>
              <p>〒641-0002 和歌山県和歌山市新中島152-18</p>
              {/* <p className="text-sm text-gray-600">
                ※具体的な住所は別途お問い合わせください
              </p> */}
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">電話番号</h3>
              <p>090-6968-8754</p>
              <p className="text-sm text-gray-600">
                受付時間：平日 10:00～18:00（土日祝除く）
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">メールアドレス</h3>
              <p>bandman.gh.bs.dk.lav＠gmail.com</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>サービス・料金について</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">サービス名称</h3>
              <p>Learning Journal プロプラン</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">販売価格</h3>
              <p>月額 680円（税込）</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">
                サービス代金以外の必要料金
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>インターネット接続料金（お客様負担）</li>
                <li>決済手数料は当社負担</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">
                お申込みの有効期限
              </h3>
              <p>特に定めておりません</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">サービス提供時期</h3>
              <p>お申込み手続き完了後、即時利用開始</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>お支払いについて</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">お支払い方法</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  クレジットカード決済（VISA、Mastercard、American
                  Express、JCB）
                </li>
                <li>Stripe決済システムを利用</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">お支払い時期</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>初回：お申込み時（7日間無料トライアル後）</li>
                <li>継続：毎月の契約更新日</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>解約・返金について</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">解約方法</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>料金プランページからいつでも解約可能</li>
                <li>Stripeカスタマーポータルからの解約</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">
                解約の効力発生時期
              </h3>
              <p>
                解約手続き完了後、次回請求日まで利用可能。次回請求日をもって解約となります。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">返金について</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>無料トライアル期間中の解約：料金は発生しません</li>
                <li>
                  有料期間中の解約：既に支払い済みの料金の返金は行いません
                </li>
                <li>当社の重大な過失による場合は、個別に対応いたします</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>免責事項・その他</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">
                サービス内容の変更
              </h3>
              <p>
                サービス内容は予告なく変更される場合があります。重要な変更については事前に通知いたします。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">利用規約</h3>
              <p>本サービスの利用には、別途定める利用規約が適用されます。</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">
                個人情報の取り扱い
              </h3>
              <p>
                個人情報の取り扱いについては、プライバシーポリシーをご確認ください。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">
                準拠法・管轄裁判所
              </h3>
              <p>
                日本法を準拠法とし、本契約に関する一切の紛争（裁判所の調停手続きを含む）は、和歌山簡易裁判所または和歌山地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>お問い合わせ</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              本表示に関するご質問やサービスに関するお問い合わせは、以下までご連絡ください。
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p>
                <strong>Learning Journal サポート</strong>
              </p>
              <p>メール：bandman.gh.bs.dk.lav＠gmail.com</p>
              <p>受付時間：平日 10:00～18:00（土日祝除く）</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>最終更新日：2025年5月31日</p>
      </div>
    </div>
  );
}
