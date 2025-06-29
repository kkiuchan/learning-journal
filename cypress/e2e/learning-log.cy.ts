describe("Learning Log Management", () => {
  beforeEach(() => {
    // ログイン済みの状態でテストを開始
    cy.login("test@example.com", "Password123!");
  });

  describe("Create Learning Log", () => {
    it("should create a new learning log successfully", () => {
      // ユニット詳細ページに移動
      cy.visit("/units/1");

      // 学習ログ作成ボタンをクリック
      cy.get('[data-testid="create-log-button"]').click();

      // ウィザードフォームが表示されることを確認
      cy.get('[data-testid="wizard-log-form"]').should("be.visible");

      // ステップ1: 基本情報の入力
      cy.get('input[name="title"]').type("React Hooksの学習");
      cy.get('input[name="learningTime"]').clear().type("120");
      cy.get('input[name="logDate"]').type("2024-01-15");

      // 次へボタンをクリック
      cy.get('[data-testid="next-button"]').click();

      // ステップ2: 学習内容の記述
      cy.get('textarea[name="note"]').type(`# React Hooksの学習

## 学習したこと
- useState フックの使い方
- useEffect フックの基本概念
- カスタムフックの作成方法

## つまづいた点
- useEffectの依存配列の理解
- 無限ループの回避方法

## 今後の課題
- useReducer の学習
- パフォーマンス最適化`);

      cy.get('[data-testid="next-button"]').click();

      // ステップ3: 効果測定
      cy.get('[data-testid="effect-score-4"]').click(); // 4つ星を選択
      cy.get('input[value="understanding"]').check();

      cy.get('[data-testid="next-button"]').click();

      // ステップ4: タグとリソースの追加
      cy.get('input[name="tag"]').type("React");
      cy.get('[data-testid="add-tag-button"]').click();

      cy.get('input[name="tag"]').type("JavaScript");
      cy.get('[data-testid="add-tag-button"]').click();

      // リソースの追加
      cy.get('input[name="resourceTitle"]').type("React公式ドキュメント");
      cy.get('input[name="resourceLink"]').type("https://reactjs.org/docs");
      cy.get('[data-testid="add-resource-button"]').click();

      cy.get('[data-testid="next-button"]').click();

      // ステップ5: 確認と送信
      cy.get('[data-testid="preview-title"]').should(
        "contain.text",
        "React Hooksの学習"
      );
      cy.get('[data-testid="preview-learning-time"]').should(
        "contain.text",
        "120分"
      );
      cy.get('[data-testid="preview-effect-score"]').should(
        "contain.text",
        "4/5"
      );

      // 作成ボタンをクリック
      cy.get('[data-testid="create-button"]').click();

      // 成功メッセージが表示されることを確認
      cy.get('[data-testid="success-message"]').should("be.visible");

      // ユニット詳細ページに戻ることを確認
      cy.url().should("include", "/units/1");

      // 作成したログが表示されることを確認
      cy.get('[data-testid="log-list"]').should(
        "contain.text",
        "React Hooksの学習"
      );
    });

    it("should validate required fields in wizard form", () => {
      cy.visit("/units/1");
      cy.get('[data-testid="create-log-button"]').click();

      // 空の状態で次へボタンをクリック
      cy.get('[data-testid="next-button"]').should("be.disabled");

      // タイトルのみ入力
      cy.get('input[name="title"]').type("テストタイトル");
      cy.get('[data-testid="next-button"]').should("not.be.disabled");

      cy.get('[data-testid="next-button"]').click();

      // 学習内容を入力せずに次へ
      cy.get('[data-testid="next-button"]').should("be.disabled");

      // 学習内容を入力
      cy.get('textarea[name="note"]').type("テスト内容");
      cy.get('[data-testid="next-button"]').should("not.be.disabled");
    });
  });

  describe("Edit Learning Log", () => {
    it("should edit existing learning log", () => {
      cy.visit("/units/1");

      // 既存のログの編集ボタンをクリック
      cy.get('[data-testid="log-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="edit-log-button"]').click();
        });

      // 編集フォームが表示されることを確認
      cy.get('[data-testid="wizard-log-form"]').should("be.visible");

      // タイトルを変更
      cy.get('input[name="title"]').clear().type("更新されたタイトル");

      // 保存
      cy.get('[data-testid="next-button"]').click(); // ステップ2へ
      cy.get('[data-testid="next-button"]').click(); // ステップ3へ
      cy.get('[data-testid="next-button"]').click(); // ステップ4へ
      cy.get('[data-testid="next-button"]').click(); // 確認へ
      cy.get('[data-testid="create-button"]').click(); // 更新

      // 更新されたタイトルが表示されることを確認
      cy.get('[data-testid="log-list"]').should(
        "contain.text",
        "更新されたタイトル"
      );
    });
  });

  describe("Delete Learning Log", () => {
    it("should delete learning log with confirmation", () => {
      cy.visit("/units/1");

      // 削除ボタンをクリック
      cy.get('[data-testid="log-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="delete-log-button"]').click();
        });

      // 確認ダイアログが表示されることを確認
      cy.get('[data-testid="delete-confirmation"]').should("be.visible");

      // 削除を確認
      cy.get('[data-testid="confirm-delete-button"]').click();

      // 成功メッセージが表示されることを確認
      cy.get('[data-testid="success-message"]').should("be.visible");
      cy.get('[data-testid="success-message"]').should(
        "contain.text",
        "削除しました"
      );
    });
  });

  describe("AI Assistance (Pro Feature)", () => {
    it("should show pro plan dialog for non-pro users", () => {
      cy.visit("/units/1");
      cy.get('[data-testid="create-log-button"]').click();

      // AI支援ボタンをクリック
      cy.get('[data-testid="ai-assist-button"]').click();

      // プロプラン案内ダイアログが表示されることを確認
      cy.get('[data-testid="pro-plan-dialog"]').should("be.visible");
      cy.get('[data-testid="pro-plan-dialog"]').should(
        "contain.text",
        "プロプラン限定機能"
      );

      // プライシングページへのリンクが機能することを確認
      cy.get('[data-testid="upgrade-to-pro-button"]').click();
      cy.url().should("include", "/pricing");
    });
  });
});
