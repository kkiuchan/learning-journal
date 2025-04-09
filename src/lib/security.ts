/**
 * コンテンツセキュリティポリシー（CSP）を生成する
 * XSS対策として利用される
 */
export function generateCSP() {
  // 本番環境では厳格なCSPを適用
  const isProd = process.env.NODE_ENV === "production";

  // 基本的なCSPディレクティブを設定
  const csp = [
    // デフォルトではすべてのリソースの読み込みを制限
    `default-src 'self'`,
    // スクリプトの実行元を制限
    `script-src 'self'${isProd ? "" : " 'unsafe-eval'"}`, // 開発環境ではeval()を許可（Next.jsの開発に必要）
    // スタイルシートの読み込み元を制限
    `style-src 'self' 'unsafe-inline'`, // CSSはインラインスタイルも許可（UIフレームワークに必要）
    // 画像の読み込み元を制限
    `img-src 'self' data: https:`, // data:URLと安全なhttpsソースからの画像を許可
    // フォントの読み込み元を制限
    `font-src 'self'`,
    // オブジェクトの読み込みを制限
    `object-src 'none'`,
    // フレームの表示を制限
    `frame-ancestors 'self'`,
    // ベースURIを制限
    `base-uri 'self'`,
    // フォーム送信先を制限
    `form-action 'self'`,
    // マニフェストの読み込み元を制限
    `manifest-src 'self'`,
    // アップグレードインセキュアリクエストを有効化
    `upgrade-insecure-requests`,
  ];

  return csp.join("; ");
}

/**
 * セキュリティヘッダーを生成する
 */
export function generateSecurityHeaders() {
  return {
    // XSS対策
    "Content-Security-Policy": generateCSP(),
    // Clickjacking対策
    "X-Frame-Options": "DENY",
    // MIMEタイプに基づくコンテンツの解釈を強制
    "X-Content-Type-Options": "nosniff",
    // XSS対策（古いブラウザ向け）
    "X-XSS-Protection": "1; mode=block",
    // リファラー情報を制限
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Feature-Policy/Permissions-Policyの設定
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

/**
 * 文字列をサニタイズする（XSS対策）
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 安全なHTMLを作成する（XSS対策）
 */
export function createSafeHTML(html: string): { __html: string } {
  return { __html: html };
}
