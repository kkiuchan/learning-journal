import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { sendTrialEndingWarning } from "@/lib/email-templates";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // テスト用のメール送信
    const testEmail = "bandman.gh.bs.dk.lav@gmail.com";
    const testName = "テストユーザー";
    const daysUntilEnd = 3;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysUntilEnd);

    await sendTrialEndingWarning(testEmail, testName, daysUntilEnd, endDate);

    return createApiResponse({
      message: `トライアル期間終了警告メール（${daysUntilEnd}日前）をテスト送信しました`,
      email: testEmail,
      daysUntilEnd,
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    console.error("トライアル期間終了警告メールテストエラー:", error);
    return createErrorResponse(
      "トライアル期間終了警告メールの送信に失敗しました",
      500
    );
  }
}
