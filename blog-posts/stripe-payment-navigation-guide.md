# 決済ページ後のページ遷移：replace vs push の正しい使い分け

## 🎯 はじめに

Stripe決済を実装していて、「決済成功後のページ遷移は `router.push()` と `router.replace()` どちらを使うべき？」という疑問を持ったことはありませんか？

この記事では、実際の学習ログアプリでの実装例を通じて、決済フロー特有の考慮事項と最適な遷移方法を解説します。

## 🔍 現在の実装状況

### Stripe決済フローの全体像

```typescript
// 1. チェックアウトセッション作成
const checkoutSession = await createCheckoutSession({
  customerId: customer.id,
  priceId: plan.stripePriceId,
  successUrl: `${req.nextUrl.origin}/dashboard?success=true&plan=${planId}`,
  cancelUrl: `${req.nextUrl.origin}/pricing?canceled=true`,
  metadata: { userId, planId },
});

// 2. Stripeページへリダイレクト
window.location.href = data.data.url;
```

### 決済成功後の処理

```typescript
// 決済成功後の処理（DashboardClient）
useEffect(() => {
  const success = searchParams.get("success");
  const plan = searchParams.get("plan");

  if (success === "true") {
    // 成功メッセージを表示
    toast.success(
      plan === "PRO"
        ? "プロプランへのアップグレードが完了しました！🎉"
        : "決済が正常に完了しました！"
    );

    // URLパラメータをクリーンアップ（replaceを使用）
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("success");
    newUrl.searchParams.delete("plan");

    // 履歴を置き換えてクリーンなURLに
    router.replace(newUrl.pathname + newUrl.search);
  }
}, [searchParams, router]);
```

## ⚖️ `push` vs `replace` の比較

### `router.push()` の場合

```typescript
// ❌ 決済後にpushを使った場合の問題
router.push("/dashboard");
```

**問題点:**

- ブラウザの戻るボタンで決済ページに戻れてしまう
- 重複決済のリスクがある
- 決済フローの履歴が残る

### `router.replace()` の場合

```typescript
// ✅ 決済後にreplaceを使った場合の利点
router.replace("/dashboard");
```

**利点:**

- 決済ページへの戻る操作を防ぐ
- 重複決済のリスクを軽減
- クリーンな履歴管理

## 🛡️ セキュリティとUXの観点

### 1. 重複決済の防止

```typescript
// 決済完了後の安全な遷移パターン
const handlePaymentSuccess = () => {
  // 1. 成功メッセージを表示
  toast.success("決済が完了しました！");

  // 2. 履歴を置き換えて戻る操作を無効化
  router.replace("/dashboard");

  // 3. 必要に応じてデータを再取得
  mutate("/api/user/subscription");
};
```

### 2. URL パラメータのクリーンアップ

```typescript
// 決済関連パラメータの安全な削除
const cleanupPaymentParams = () => {
  const url = new URL(window.location.href);

  // 決済関連パラメータを削除
  url.searchParams.delete("success");
  url.searchParams.delete("plan");
  url.searchParams.delete("session_id");

  // 履歴を置き換え（戻るボタンでパラメータ付きURLに戻らない）
  router.replace(url.pathname + url.search);
};
```

## 📋 決済フロー別の使い分けガイド

### 1. Stripe Checkout使用時

```typescript
// ✅ 推奨パターン
successUrl: `${origin}/dashboard?success=true&plan=${planId}`;

// フロントエンド側での処理
useEffect(() => {
  if (searchParams.get("success") === "true") {
    // 成功処理
    handlePaymentSuccess();

    // replaceでクリーンアップ
    router.replace("/dashboard");
  }
}, []);
```

### 2. カスタム決済フォーム使用時

```typescript
const handleSubmit = async () => {
  try {
    const result = await processPayment(paymentData);

    if (result.success) {
      // 成功時はreplaceを使用
      router.replace("/dashboard?payment=success");
    }
  } catch (error) {
    // エラー時はpushでも可（再試行可能にするため）
    router.push("/payment?error=true");
  }
};
```

### 3. サブスクリプション管理時

```typescript
// カスタマーポータルからの戻り
const handlePortalReturn = () => {
  // サブスクリプション情報を更新
  mutate("/api/user/subscription");

  // replaceで履歴をクリーンに
  router.replace("/dashboard");
};
```

## 🔧 実装のベストプラクティス

### 1. 包括的な決済後処理

```typescript
const usePaymentSuccessHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");

    if (success === "true" && sessionId) {
      // 1. Webhook処理の完了を待つ
      const checkPaymentStatus = async () => {
        try {
          const response = await fetch(`/api/payment/verify/${sessionId}`);
          const data = await response.json();

          if (data.verified) {
            // 2. 成功メッセージ
            toast.success("決済が完了しました！");

            // 3. データを再取得
            mutate("/api/user/subscription");

            // 4. URLをクリーンアップ
            router.replace("/dashboard");
          }
        } catch (error) {
          console.error("Payment verification failed:", error);
        }
      };

      checkPaymentStatus();
    }
  }, [searchParams, router]);
};
```

### 2. エラーハンドリング

```typescript
const handlePaymentError = (error: PaymentError) => {
  // エラーの種類に応じて処理を分岐
  switch (error.type) {
    case "card_declined":
      // 再試行可能なエラー - pushを使用
      router.push("/payment?retry=true");
      break;

    case "insufficient_funds":
      // 決済方法変更が必要 - replaceを使用
      router.replace("/payment/methods");
      break;

    default:
      // 一般的なエラー
      router.replace("/payment?error=general");
  }
};
```

## 📊 パフォーマンスへの影響

### メモリ使用量の比較

```typescript
// push: 履歴スタックが増加
router.push("/page1"); // スタック: [/, /page1]
router.push("/page2"); // スタック: [/, /page1, /page2]
router.push("/page3"); // スタック: [/, /page1, /page2, /page3]

// replace: 履歴スタックが一定
router.replace("/page1"); // スタック: [/page1]
router.replace("/page2"); // スタック: [/page2]
router.replace("/page3"); // スタック: [/page3]
```

## 🎯 まとめ

### 決済後の遷移では `router.replace()` を使うべき理由

1. **セキュリティ**: 重複決済を防ぐ
2. **UX**: 自然な操作フローを提供
3. **履歴管理**: クリーンなブラウザ履歴
4. **パフォーマンス**: メモリ使用量の最適化

### 実装チェックリスト

- [ ] 決済成功後は `router.replace()` を使用
- [ ] URLパラメータのクリーンアップを実装
- [ ] 適切な成功メッセージを表示
- [ ] Webhook処理の完了を確認
- [ ] エラーケースの適切な処理
- [ ] ブラウザ戻るボタンのテスト実施

決済フローは特にユーザー体験とセキュリティが重要な部分です。適切な遷移方法を選択することで、安全で使いやすいアプリケーションを構築できます。
