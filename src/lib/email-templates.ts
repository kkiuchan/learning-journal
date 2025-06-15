import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// メール送信の共通設定
const EMAIL_CONFIG = {
  from: "Learning Journal <noreply@learning-journal-app.com>",
  replyTo: (
    process.env.SUPPORT_EMAIL || "noreply@learning-journal-app.com"
  ).trim(),
};

// 支払い失敗通知メール
export async function sendPaymentFailedNotification(
  userEmail: string,
  userName: string | null,
  amount: number,
  currency: string = "jpy"
) {
  const formattedAmount = `¥${amount.toLocaleString()}`;

  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [userEmail],
      subject: "【重要】支払いに失敗しました - Learning Journal",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #dc3545; margin: 0 0 16px 0;">支払いに失敗しました</h1>
            <p>こんにちは${userName ? ` ${userName}` : ""}さん、</p>
            <p>Learning Journalのプロプラン（${formattedAmount}）の支払い処理に失敗しました。</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px;">必要な対応</h2>
            <p>以下のいずれかの方法で支払い方法を更新してください：</p>
            <ul style="color: #6c757d;">
              <li>カード情報の有効期限が切れていないか確認</li>
              <li>カードの利用限度額を確認</li>
              <li>別の支払い方法に変更</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              支払い方法を更新
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>ご注意：</strong> 
              支払いが続けて失敗した場合、一時的にサービス機能が制限される可能性があります。
            </p>
          </div>
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d;">
            <p>ご不明な点がございましたら、お気軽にサポートまでお問い合わせください。</p>
            <p>Learning Journal チーム</p>
          </div>
        </div>
      `,
    });

    console.log(`Payment failed notification sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send payment failed notification:", error);
  }
}

// 支払い成功通知メール
export async function sendPaymentSucceededNotification(
  userEmail: string,
  userName: string | null,
  amount: number,
  receiptUrl?: string
) {
  const formattedAmount = `¥${amount.toLocaleString()}`;

  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [userEmail],
      subject: "お支払いありがとうございます - Learning Journal",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #155724; margin: 0 0 16px 0;">お支払いが完了しました</h1>
            <p>こんにちは${userName ? ` ${userName}` : ""}さん、</p>
            <p>Learning Journalプロプランのお支払い（${formattedAmount}）が正常に処理されました。</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px;">プロプラン機能をお楽しみください</h2>
            <ul style="color: #6c757d;">
              <li>学習ユニット 無制限作成</li>
              <li>学習ログ 無制限記録</li>
              <li>AI機能（アドバイス・サジェスト）</li>
              <li>詳細分析・レポート機能</li>
              <li>データエクスポート機能</li>
            </ul>
          </div>
          
          ${
            receiptUrl
              ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${receiptUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              レシートを確認
            </a>
          </div>
          `
              : ""
          }
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d;">
            <p>ご利用いただき、ありがとうございます。</p>
            <p>Learning Journal チーム</p>
          </div>
        </div>
      `,
    });

    console.log(`Payment success notification sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send payment success notification:", error);
  }
}

// 期間終了前警告メール
export async function sendExpiryWarningNotification(
  userEmail: string,
  userName: string | null,
  daysUntilExpiry: number,
  expiryDate: Date
) {
  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [userEmail],
      subject: `【重要】プロプランの期限が${daysUntilExpiry}日後に終了します - Learning Journal`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #856404; margin: 0 0 16px 0;">プロプランの期限が近づいています</h1>
            <p>こんにちは${userName ? ` ${userName}` : ""}さん、</p>
            <p>Learning Journalプロプランの期限が<strong>${daysUntilExpiry}日後（${expiryDate.toLocaleDateString()}）</strong>に終了予定です。</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px;">期間終了後の影響</h2>
            <ul style="color: #6c757d;">
              <li>AI機能（アドバイス・サジェスト）が利用できなくなります</li>
              <li>学習ユニット・ログは引き続き無制限でご利用いただけます</li>
              <li>基本的な学習記録機能は継続してご利用いただけます</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
               style="display: inline-block; padding: 12px 24px; background-color: #ffc107; color: #212529; text-decoration: none; border-radius: 6px; font-weight: bold;">
              プランを管理
            </a>
          </div>
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d;">
            <p>継続してプロプランをご利用いただく場合は、上記ボタンから設定を確認してください。</p>
            <p>Learning Journal チーム</p>
          </div>
        </div>
      `,
    });

    console.log(
      `Expiry warning notification sent to ${userEmail} (${daysUntilExpiry} days)`
    );
  } catch (error) {
    console.error("Failed to send expiry warning notification:", error);
  }
}

// サブスクリプションキャンセル通知メール
export async function sendSubscriptionCancelledNotification(
  userEmail: string,
  userName: string | null,
  endDate: Date
) {
  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [userEmail],
      subject: "サブスクリプションのキャンセルを承りました - Learning Journal",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #856404; margin: 0 0 16px 0;">サブスクリプションキャンセルのお知らせ</h1>
            <p>こんにちは${userName ? ` ${userName}` : ""}さん、</p>
            <p>Learning Journalプロプランのキャンセルを承りました。</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px;">重要事項</h2>
            <ul style="color: #6c757d;">
              <li><strong>現在の期間終了日: ${endDate.toLocaleDateString("ja-JP")}</strong></li>
              <li>期間終了まではプロプラン機能をご利用いただけます</li>
              <li>期間終了後は自動的に無料プランに移行されます</li>
              <li>追加の課金は発生しません</li>
            </ul>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #0c5460;">期間終了後の変更点</h3>
            <ul style="margin: 8px 0 0 0; color: #0c5460; font-size: 14px;">
              <li>AI機能（アドバイス・サジェスト）が利用できなくなります</li>
              <li>学習ユニット・ログは引き続き無制限でご利用いただけます</li>
              <li>基本的な学習記録機能は継続してご利用いただけます</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
               style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              サブスクリプションを再開
            </a>
          </div>
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d;">
            <p>ご利用いただき、ありがとうございました。<br>
            またのご利用をお待ちしております。</p>
            <p>Learning Journal チーム</p>
          </div>
        </div>
      `,
    });

    console.log(`Subscription cancelled notification sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send subscription cancelled notification:", error);
  }
}

// サブスクリプション更新通知メール
export async function sendSubscriptionUpdatedNotification(
  userEmail: string,
  userName: string | null,
  newEndDate: Date,
  isReactivated: boolean = false
) {
  const action = isReactivated ? "再開" : "更新";

  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [userEmail],
      subject: `サブスクリプションの${action}が完了しました - Learning Journal`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #155724; margin: 0 0 16px 0;">サブスクリプション${action}完了</h1>
            <p>こんにちは${userName ? ` ${userName}` : ""}さん、</p>
            <p>Learning Journalプロプランの${action}が完了しました。</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px;">更新内容</h2>
            <ul style="color: #6c757d;">
              <li><strong>次回更新日: ${newEndDate.toLocaleDateString("ja-JP")}</strong></li>
              <li>プロプラン機能が継続してご利用いただけます</li>
              <li>AI機能、無制限作成・記録が利用可能です</li>
            </ul>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #0c5460;">プロプラン機能</h3>
            <ul style="margin: 8px 0 0 0; color: #0c5460; font-size: 14px;">
              <li>学習ユニット 無制限作成</li>
              <li>学習ログ 無制限記録</li>
              <li>AI機能（アドバイス・サジェスト）</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              ダッシュボードへ
            </a>
          </div>
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d;">
            <p>引き続きLearning Journalをお楽しみください。</p>
            <p>Learning Journal チーム</p>
          </div>
        </div>
      `,
    });

    console.log(`Subscription updated notification sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send subscription updated notification:", error);
  }
}

// トライアル期間終了前警告メール
export async function sendTrialEndingWarning(
  userEmail: string,
  userName: string | null,
  daysUntilEnd: number,
  endDate: Date
) {
  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [userEmail],
      subject: `【重要】プロプラン無料トライアルが${daysUntilEnd}日後に終了します - Learning Journal`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #856404; margin: 0 0 16px 0;">無料トライアル期間終了のお知らせ</h1>
            <p>こんにちは${userName ? ` ${userName}` : ""}さん、</p>
            <p>Learning Journalプロプランの無料トライアル期間が<strong>${daysUntilEnd}日後（${endDate.toLocaleDateString()}）</strong>に終了予定です。</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px;">トライアル終了後の影響</h2>
            <ul style="color: #6c757d;">
              <li><strong>自動的にプロプラン（月額80円）が開始されます</strong></li>
              <li>AI機能を継続してご利用いただけます</li>
              <li>学習ユニット・ログは引き続き無制限でご利用いただけます</li>
            </ul>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #0c5460;">プロプランを継続するメリット</h3>
            <ul style="margin: 8px 0 0 0; color: #0c5460; font-size: 14px;">
              <li>AIアドバイス機能で効果的な学習提案を受け取れます</li>
              <li>AI学習サジェスト機能で学習内容の改善ができます</li>
              <li>学習ユニット・ログを無制限で作成・記録できます</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
               style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              トライアルをキャンセル
            </a>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              継続する場合は、特に何もしていただく必要はありません。<br>
              トライアル期間終了後、自動的にプロプラン（月額680円）が開始されます。
            </p>
          </div>
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d;">
            <p>ご質問がございましたら、お気軽にお問い合わせください。</p>
            <p>Learning Journal チーム</p>
          </div>
        </div>
      `,
    });

    console.log(
      `Trial ending warning sent to ${userEmail} (${daysUntilEnd} days left)`
    );
  } catch (error) {
    console.error("Failed to send trial ending warning:", error);
  }
}

// トライアル開始ウェルカムメール
export async function sendTrialStartedWelcome(
  userEmail: string,
  userName: string | null,
  trialEndDate: Date
) {
  try {
    await resend.emails.send({
      ...EMAIL_CONFIG,
      to: [userEmail],
      subject: "🎉 プロプラン無料トライアル開始！Learning Journalへようこそ",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #155724; margin: 0 0 16px 0;">🎉 プロプラン無料トライアル開始！</h1>
            <p>こんにちは${userName ? ` ${userName}` : ""}さん、</p>
            <p>Learning Journalプロプランの<strong>7日間無料トライアル</strong>が開始されました！</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #495057; font-size: 18px;">🚀 今すぐ使えるプロプラン機能</h2>
            <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <ul style="color: #495057; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;"><strong>🤖 AIアドバイス機能</strong> - あなたの学習内容を分析し、効果的な改善提案を提供</li>
                <li style="margin: 8px 0;"><strong>✨ AI学習サジェスト機能</strong> - 学習目標に基づいた最適な学習内容を提案</li>
                <li style="margin: 8px 0;"><strong>📊 学習ユニット・ログ無制限</strong> - 制限なしで学習記録を作成・管理</li>
                <li style="margin: 8px 0;"><strong>📱 基本分析機能</strong> - 学習進捗の可視化と統計</li>
              </ul>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #856404;">📅 トライアル期間について</h3>
            <ul style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">
              <li><strong>期間: 7日間</strong>（${trialEndDate.toLocaleDateString("ja-JP")}まで）</li>
              <li><strong>料金: 完全無料</strong> - トライアル期間中は一切課金されません</li>
              <li><strong>トライアル終了後: 自動的にプロプラン（月額680円）に移行</strong></li>
              <li><strong>キャンセル: トライアル期間中はいつでも可能</strong> - 違約金などは一切ありません</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="display: inline-block; padding: 14px 28px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 16px;">
              📊 ダッシュボードを見る
            </a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/units/create" 
               style="display: inline-block; padding: 14px 28px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              📝 学習ユニットを作成
            </a>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #0c5460;">💡 はじめ方ガイド</h3>
            <ol style="margin: 8px 0 0 0; color: #0c5460; font-size: 14px;">
              <li style="margin: 4px 0;">まずは学習目標を設定して「学習ユニット」を作成してみましょう</li>
              <li style="margin: 4px 0;">日々の学習内容を「学習ログ」として記録しましょう</li>
              <li style="margin: 4px 0;">AI機能を使って学習内容の改善提案を受け取りましょう</li>
              <li style="margin: 4px 0;">ダッシュボードで学習進捗を確認・分析しましょう</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              トライアル期間終了の3日前にリマインダーメールをお送りします。<br>
              <strong>継続しない場合は、トライアル期間中にキャンセルしてください。</strong><br>
              キャンセルしない場合、自動的にプロプラン（月額680円）が開始されます。
            </p>
          </div>
          
          <div style="margin: 30px 0; font-size: 14px; color: #6c757d;">
            <p>素晴らしい学習体験をお楽しみください！<br>
            ご質問がございましたら、お気軽にお問い合わせください。</p>
            <p>Learning Journal チーム</p>
          </div>
        </div>
      `,
    });

    console.log(
      `Trial started welcome email sent to ${userEmail} (trial ends: ${trialEndDate.toLocaleDateString()})`
    );
  } catch (error) {
    console.error("Failed to send trial started welcome email:", error);
  }
}
