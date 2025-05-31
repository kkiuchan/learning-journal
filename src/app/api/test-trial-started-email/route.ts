import { createApiResponse, createErrorResponse } from "@/lib/api-utils";
import { sendTrialStartedWelcome } from "@/lib/email-templates";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // テスト用のメール送信
    const testEmail = "bandman.gh.bs.dk.lav@gmail.com";
    const testName = "テストユーザー";
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7日後

    await sendTrialStartedWelcome(testEmail, testName, trialEndDate);

    return createApiResponse({
      message: "トライアル開始ウェルカムメールをテスト送信しました",
      email: testEmail,
      trialEndDate: trialEndDate.toISOString(),
    });
  } catch (error) {
    console.error("トライアル開始ウェルカムメールテストエラー:", error);
    return createErrorResponse(
      "トライアル開始ウェルカムメールの送信に失敗しました",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return createErrorResponse("メールアドレスは必須です", 400);
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7日後

    await sendTrialStartedWelcome(
      email,
      name || "テストユーザー",
      trialEndDate
    );

    return createApiResponse({
      message: "トライアル開始ウェルカムメールを送信しました",
      details: {
        recipient: email,
        trialEndDate: trialEndDate.toLocaleDateString("ja-JP"),
      },
    });
  } catch (error) {
    console.error("トライアル開始ウェルカムメール送信エラー:", error);
    return createErrorResponse(
      "トライアル開始ウェルカムメールの送信に失敗しました",
      500
    );
  }
}
