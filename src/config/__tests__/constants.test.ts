/**
 * @jest-environment jsdom
 */
import { expect } from "@jest/globals";
import { MAX_TOKENS, OPENAI_MODEL, TEMPERATURE } from "../constants";

describe("Constants", () => {
  describe("OpenAI設定", () => {
    it("OPENAI_MODELが正しい値であること", () => {
      expect(OPENAI_MODEL).toBe("gpt-4.1-nano");
      expect(typeof OPENAI_MODEL).toBe("string");
    });

    it("MAX_TOKENSが正しい値であること", () => {
      expect(MAX_TOKENS).toBe(1000);
      expect(typeof MAX_TOKENS).toBe("number");
      expect(MAX_TOKENS).toBeGreaterThan(0);
    });

    it("TEMPERATUREが正しい値であること", () => {
      expect(TEMPERATURE).toBe(0.7);
      expect(typeof TEMPERATURE).toBe("number");
      expect(TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(TEMPERATURE).toBeLessThanOrEqual(2);
    });
  });

  describe("定数の型と値の妥当性", () => {
    it("全ての定数が定義されていること", () => {
      expect(OPENAI_MODEL).toBeDefined();
      expect(MAX_TOKENS).toBeDefined();
      expect(TEMPERATURE).toBeDefined();
    });

    it("値がnullやundefinedでないこと", () => {
      expect(OPENAI_MODEL).not.toBeNull();
      expect(OPENAI_MODEL).not.toBeUndefined();
      expect(MAX_TOKENS).not.toBeNull();
      expect(MAX_TOKENS).not.toBeUndefined();
      expect(TEMPERATURE).not.toBeNull();
      expect(TEMPERATURE).not.toBeUndefined();
    });

    it("OpenAIモデル名が空文字でないこと", () => {
      expect(OPENAI_MODEL.length).toBeGreaterThan(0);
      expect(OPENAI_MODEL.trim()).toBe(OPENAI_MODEL); // 前後に空白がないこと
    });

    it("MAX_TOKENSが妥当な範囲であること", () => {
      expect(MAX_TOKENS).toBeGreaterThan(0);
      expect(MAX_TOKENS).toBeLessThanOrEqual(100000); // 現実的な上限
      expect(Number.isInteger(MAX_TOKENS)).toBe(true); // 整数であること
    });

    it("TEMPERATUREが妥当な範囲であること", () => {
      expect(TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(TEMPERATURE).toBeLessThanOrEqual(2); // OpenAIの仕様上の上限
    });
  });

  describe("設定値の組み合わせ", () => {
    it("全ての設定値が組み合わせて使用可能であること", () => {
      // 実際のAPIリクエストのようなオブジェクトを作成
      const apiConfig = {
        model: OPENAI_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      };

      expect(apiConfig.model).toBe("gpt-4.1-nano");
      expect(apiConfig.max_tokens).toBe(1000);
      expect(apiConfig.temperature).toBe(0.7);
    });
  });
});
