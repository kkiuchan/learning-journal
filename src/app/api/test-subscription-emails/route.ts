import {
  sendSubscriptionCancelledNotification,
  sendSubscriptionUpdatedNotification,
} from "@/lib/email-templates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name, type } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "メールアドレスは必須です" } },
        { status: 400 }
      );
    }

    if (!type || !["cancelled", "updated", "reactivated"].includes(type)) {
      return NextResponse.json(
        {
          error: {
            message:
              "有効なtype（cancelled, updated, reactivated）を指定してください",
          },
        },
        { status: 400 }
      );
    }

    // テスト用の日付（30日後）
    const testEndDate = new Date();
    testEndDate.setDate(testEndDate.getDate() + 30);

    switch (type) {
      case "cancelled":
        await sendSubscriptionCancelledNotification(
          email,
          name || "テストユーザー",
          testEndDate
        );
        break;

      case "updated":
        await sendSubscriptionUpdatedNotification(
          email,
          name || "テストユーザー",
          testEndDate,
          false // 更新
        );
        break;

      case "reactivated":
        await sendSubscriptionUpdatedNotification(
          email,
          name || "テストユーザー",
          testEndDate,
          true // 再開
        );
        break;
    }

    return NextResponse.json({
      success: true,
      message: `サブスクリプション${
        type === "cancelled"
          ? "キャンセル"
          : type === "reactivated"
            ? "再開"
            : "更新"
      }通知メールを送信しました`,
      details: {
        recipient: email,
        type,
        endDate: testEndDate.toLocaleDateString("ja-JP"),
      },
    });
  } catch (error) {
    console.error("サブスクリプション通知メール送信エラー:", error);
    return NextResponse.json(
      { error: { message: "メール送信に失敗しました" } },
      { status: 500 }
    );
  }
}
