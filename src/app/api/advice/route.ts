import { authConfig } from "@/auth.config";
import { MAX_TOKENS, OPENAI_MODEL, TEMPERATURE } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// プロンプトを生成する関数
function createPrompt(unit: any, role: "expert" | "mentor" = "expert"): string {
  const roleInstruction =
    role === "expert"
      ? "あなたは学習に関するアドバイスの専門家です。"
      : "あなたは学生のメンターとして、温かく具体的なアドバイスを提供してください。";

  let prompt = `${roleInstruction}\n\n`;
  prompt += `以下の学習ユニットの情報に基づいて、具体的な改善提案や実践的なアドバイスを提供してください。\n\n`;

  prompt += `【タイトル】\n${unit.title}\n\n`;

  if (unit.preLearningState) {
    prompt += `【学習前の状態】\n${unit.preLearningState}\n\n`;
  }

  if (unit.learningGoal) {
    prompt += `【学習目標】\n${unit.learningGoal}\n\n`;
  }

  if (unit.reflection) {
    prompt += `【振り返り】\n${unit.reflection}\n\n`;
  }

  return prompt;
}

export async function POST(request: Request) {
  try {
    // セッションの確認
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディの取得
    const { unitId, role } = await request.json();

    if (!unitId) {
      return NextResponse.json(
        { error: "Unit ID is required" },
        { status: 400 }
      );
    }

    // ユニット情報の取得
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(unitId) },
      include: {
        user: true,
        logs: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // プロンプトの生成
    const prompt = createPrompt(unit, role);

    // OpenAIクライアントの初期化
    const openai = new OpenAI();

    // ストリーミングレスポンスの取得
    const events = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      stream: true,
    });

    // ReadableStreamの作成
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // クライアントにイベントを送信
            const data = JSON.stringify({
              event: "content",
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // ストリームの終了を明示的に通知
          controller.enqueue(`data: {"event":"done"}\n\n`);
          // ストリームの終了
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // SSEとしてReadableStreamを返す
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
