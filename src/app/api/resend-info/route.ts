import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { Resend } = require("resend");

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY が設定されていません" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // ドメイン情報を取得
    let domains = [];
    try {
      const domainsResponse = await resend.domains.list();
      domains = domainsResponse.data || [];
    } catch (domainError) {
      console.error("Domain list error:", domainError);
    }

    // APIキー情報を取得
    let apiKeyInfo = null;
    try {
      // APIキーの詳細を取得（可能な場合）
      const keyResponse = await fetch("https://api.resend.com/api-keys", {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
      });
      if (keyResponse.ok) {
        apiKeyInfo = await keyResponse.json();
      }
    } catch (keyError) {
      console.error("API key info error:", keyError);
    }

    return NextResponse.json({
      status: "success",
      resendInfo: {
        domains: domains,
        apiKeyValid: !!process.env.RESEND_API_KEY,
        apiKeyInfo: apiKeyInfo,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Resend info error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
