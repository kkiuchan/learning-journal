import { expect } from "@jest/globals";
import { userLoginSchema, userRegistrationSchema } from "../user";

describe("User Validation Schemas", () => {
  describe("userRegistrationSchema", () => {
    it("should validate valid email registration", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123!",
        provider: "email" as const,
      };

      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "Password123!",
        provider: "email" as const,
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "有効なメールアドレス"
        );
      }
    });

    it("should reject weak password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "123", // 弱いパスワード
        provider: "email" as const,
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("should validate OAuth registration without password", () => {
      const validData = {
        email: "test@example.com",
        provider: "google" as const,
      };

      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid provider", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123!",
        provider: "invalid-provider",
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("userLoginSchema", () => {
    it("should validate valid login data", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123!",
      };

      const result = userLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
        password: "Password123!",
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "123",
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
