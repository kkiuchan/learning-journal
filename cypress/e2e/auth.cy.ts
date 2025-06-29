describe("Authentication Flow", () => {
  beforeEach(() => {
    // テスト前にセッションをクリア
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe("Login", () => {
    it("should login with valid credentials", () => {
      cy.visit("/auth/login");

      // フォームが表示されることを確認
      cy.get('[data-testid="login-form"]').should("be.visible");

      // 正しい認証情報を入力
      cy.get('input[name="email"]').type("test@example.com");
      cy.get('input[name="password"]').type("Password123!");

      // ログインボタンをクリック
      cy.get('button[type="submit"]').click();

      // ダッシュボードにリダイレクトされることを確認
      cy.url().should("include", "/dashboard");
      cy.get('[data-testid="dashboard"]').should("be.visible");
    });

    it("should show error for invalid credentials", () => {
      cy.visit("/auth/login");

      // 間違った認証情報を入力
      cy.get('input[name="email"]').type("invalid@example.com");
      cy.get('input[name="password"]').type("wrongpassword");

      cy.get('button[type="submit"]').click();

      // エラーメッセージが表示されることを確認
      cy.get('[data-testid="error-message"]').should("be.visible");
      cy.get('[data-testid="error-message"]').should(
        "contain.text",
        "Invalid credentials"
      );
    });

    it("should validate required fields", () => {
      cy.visit("/auth/login");

      // 空の状態でSubmit
      cy.get('button[type="submit"]').click();

      // バリデーションエラーが表示されることを確認
      cy.get('[data-testid="email-error"]').should("be.visible");
      cy.get('[data-testid="password-error"]').should("be.visible");
    });
  });

  describe("Registration", () => {
    it("should register new user", () => {
      cy.visit("/auth/register");

      // フォームが表示されることを確認
      cy.get('[data-testid="register-form"]').should("be.visible");

      // 新しいユーザー情報を入力
      const timestamp = Date.now();
      cy.get('input[name="email"]').type(`newuser${timestamp}@example.com`);
      cy.get('input[name="password"]').type("NewPassword123!");

      // 登録ボタンをクリック
      cy.get('button[type="submit"]').click();

      // 確認メッセージまたはリダイレクトを確認
      cy.url().should("include", "/auth/verify-notice");
      cy.get('[data-testid="verify-notice"]').should("be.visible");
    });

    it("should validate password requirements", () => {
      cy.visit("/auth/register");

      cy.get('input[name="email"]').type("test@example.com");
      cy.get('input[name="password"]').type("weak"); // 弱いパスワード

      cy.get('button[type="submit"]').click();

      // パスワード要件のエラーが表示されることを確認
      cy.get('[data-testid="password-error"]').should("be.visible");
      cy.get('[data-testid="password-error"]').should(
        "contain.text",
        "8文字以上"
      );
    });
  });

  describe("Logout", () => {
    it("should logout successfully", () => {
      // 事前にログイン
      cy.login("test@example.com", "Password123!");

      // ダッシュボードにいることを確認
      cy.visit("/dashboard");
      cy.get('[data-testid="dashboard"]').should("be.visible");

      // ログアウトボタンをクリック
      cy.get('[data-testid="logout-button"]').click();

      // ログインページにリダイレクトされることを確認
      cy.url().should("include", "/auth/login");
    });
  });
});
