/// <reference types="cypress" />

// cypress/support/commands.ts

// カスタムコマンドの型定義
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * ユーザーとしてログインする
       * @param email - ユーザーのメールアドレス
       * @param password - ユーザーのパスワード
       */
      login(email: string, password: string): Chainable<Element>;

      /**
       * テストユーザーを作成する
       * @param userData - ユーザーデータ
       */
      createTestUser(userData: {
        email: string;
        password: string;
      }): Chainable<Element>;

      /**
       * テストユニットを作成する
       * @param unitData - ユニットデータ
       */
      createTestUnit(unitData: {
        title: string;
        learningGoal?: string;
      }): Chainable<Element>;

      /**
       * 特定の要素が読み込まれるまで待機
       * @param selector - 要素のセレクター
       * @param timeout - タイムアウト時間（ミリ秒）
       */
      waitForElement(
        selector: string,
        timeout?: number
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// ログインコマンド
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.visit("/auth/login");
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/dashboard");
    },
    {
      validate() {
        // セッションが有効かチェック
        cy.visit("/dashboard");
        cy.get('[data-testid="dashboard"]').should("exist");
      },
    }
  );
});

// テストユーザー作成コマンド
Cypress.Commands.add("createTestUser", (userData) => {
  cy.request({
    method: "POST",
    url: "/api/auth/register",
    body: userData,
  }).then((response) => {
    expect(response.status).to.eq(201);
  });
});

// テストユニット作成コマンド
Cypress.Commands.add("createTestUnit", (unitData) => {
  cy.request({
    method: "POST",
    url: "/api/units",
    body: {
      title: unitData.title,
      learningGoal: unitData.learningGoal || "",
      preLearningState: "",
      reflection: "",
      nextAction: "",
      status: "active",
      displayFlag: true,
    },
    headers: {
      Authorization: `Bearer ${Cypress.env("authToken")}`,
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

// 要素の待機コマンド
Cypress.Commands.add("waitForElement", (selector: string, timeout = 10000) => {
  return cy.get(selector, { timeout });
});

export {};
