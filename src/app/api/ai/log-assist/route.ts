import { MAX_TOKENS, OPENAI_MODEL, TEMPERATURE } from "@/config/constants";
import { createErrorResponse } from "@/lib/api-utils";
import { getSupabaseServerUser } from "@/lib/auth-helpers";
import { ensurePrismaConnected, prisma } from "@/lib/prisma";
import { canUseAIFeatures, createPlanLimitResponse } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface LogAssistRequest {
  step: number;
  data: {
    title?: string;
    note?: string;
    learningTime?: number;
    effectScore?: number;
    effectType?: string;
    tags?: string[];
  };
  unitId: string;
}

interface AIAssistResponse {
  suggestions: {
    titles?: string[];
    tags?: string[];
    resources?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    feedback?: string;
  };
}

// OpenAI APIクライアントの初期化
const openai = new OpenAI();

export async function POST(
  request: NextRequest
): Promise<NextResponse<AIAssistResponse | { error: string }>> {
  await ensurePrismaConnected();

  try {
    // Supabase認証の確認
    const user = await getSupabaseServerUser();

    if (!user?.email) {
      return createErrorResponse("認証が必要です", 401);
    }

    // プラン制限チェック
    const canUseAI = await canUseAIFeatures(user.id);
    if (!canUseAI) {
      const limitResponse = createPlanLimitResponse("AI学習サジェスト機能");
      return NextResponse.json(limitResponse, { status: 403 });
    }

    const body: LogAssistRequest = await request.json();
    const { step, data, unitId } = body;

    // ユニット情報を取得
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(unitId) },
      select: {
        title: true,
        learningGoal: true,
        preLearningState: true,
        reflection: true,
        status: true,
        unitTags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!unit) {
      return createErrorResponse("ユニットが見つかりません", 404);
    }

    // 過去のログからパターンを分析
    const pastLogs = await prisma.log.findMany({
      where: { unitId: parseInt(unitId) },
      select: {
        title: true,
        note: true,
        effectScore: true,
        effectType: true,
        learningTime: true,
        logDate: true,
        logTags: {
          select: {
            tag: { select: { name: true } },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    // ユーザーの学習履歴統計
    const userStats = await getUserLearningStats(user.id);

    // OpenAI APIを使用して提案を生成
    const suggestions = await generateAISuggestions(
      step,
      data,
      unit,
      pastLogs,
      userStats
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI assist error:", error);
    return createErrorResponse("AI提案の生成中にエラーが発生しました", 500);
  }
}

// ユーザーの学習統計を取得
async function getUserLearningStats(userId: string) {
  const stats = await prisma.log.aggregate({
    where: { userId },
    _avg: {
      effectScore: true,
      learningTime: true,
    },
    _count: {
      id: true,
    },
  });

  const preferredTags = await prisma.logTag.groupBy({
    by: ["tagId"],
    where: {
      log: {
        userId: userId,
      },
    },
    _count: {
      tagId: true,
    },
    orderBy: {
      _count: {
        tagId: "desc",
      },
    },
    take: 5,
  });

  const tagNames = await prisma.tag.findMany({
    where: {
      id: {
        in: preferredTags.map((pt) => pt.tagId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return {
    totalLogs: stats._count.id,
    avgEffectScore: stats._avg.effectScore,
    avgLearningTime: stats._avg.learningTime,
    preferredTags: tagNames.map((tag) => tag.name),
  };
}

// OpenAI APIを使用して提案を生成
async function generateAISuggestions(
  step: number,
  data: any,
  unit: any,
  pastLogs: any[],
  userStats: any
): Promise<AIAssistResponse["suggestions"]> {
  const prompt = createPromptForStep(step, data, unit, pastLogs, userStats);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `あなたは学習支援AIアシスタントです。学習者の学習ログ作成をサポートし、効果的な学習を促進する提案を行います。
常に以下の原則に従って回答してください：
1. 学習者の成長を第一に考える
2. 具体的で実践的な提案をする
3. 過去の学習パターンを考慮する
4. JSON形式で構造化された回答をする
5. 日本語で自然な表現を使う`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI APIからの応答が空です");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    // フォールバック: 基本的な提案を返す
    return generateFallbackSuggestions(step, data, unit, pastLogs);
  }
}

// ステップ別のプロンプトを作成
function createPromptForStep(
  step: number,
  data: any,
  unit: any,
  pastLogs: any[],
  userStats: any
): string {
  const baseContext = `
【学習ユニット情報】
- タイトル: ${unit.title}
- 学習目標: ${unit.learningGoal || "未設定"}
- 事前学習状態: ${unit.preLearningState || "未設定"}
- 現在のステータス: ${unit.status}
- ユニットタグ: ${unit.unitTags.map((ut: any) => ut.tag.name).join(", ") || "なし"}

【学習者の統計情報】
- 総学習ログ数: ${userStats.totalLogs}
- 平均効果スコア: ${userStats.avgEffectScore?.toFixed(1) || "未計測"}
- 平均学習時間: ${userStats.avgLearningTime || "未計測"}分
- よく使うタグ: ${userStats.preferredTags.join(", ") || "なし"}

【過去の学習ログ（最新5件）】
${pastLogs
  .slice(0, 5)
  .map(
    (log, index) => `
${index + 1}. ${log.title}
   - 学習時間: ${log.learningTime}分
   - 効果スコア: ${log.effectScore}
   - 効果タイプ: ${log.effectType}
   - タグ: ${log.logTags.map((lt: any) => lt.tag.name).join(", ")}
   - 内容: ${log.note?.substring(0, 100) || "記載なし"}...
`
  )
  .join("")}
`;

  switch (step) {
    case 1: // 基本情報
      return `${baseContext}

【現在の入力情報】
- 入力済み情報: なし（学習内容を提案してください）

過去の学習ログとユニットの進捗状況を分析して、今回学習すべき内容のタイトルを提案してください。

以下の観点を考慮してください：
1. 学習ユニットの目標に対する進捗
2. 過去のログで扱っていない領域
3. 前回の学習から自然に続く次のステップ
4. 学習の深度を段階的に上げる内容
5. 実践的な応用につながる内容

以下のJSON形式で4つのタイトル案を提案してください：
{
  "titles": ["学習内容タイトル1", "学習内容タイトル2", "学習内容タイトル3", "学習内容タイトル4"],
  "feedback": "これらの学習内容を提案した理由と、学習の進め方についてのアドバイス"
}`;

    case 2: // 内容記述
      return `${baseContext}

【現在の入力情報】
- 設定されたタイトル: ${data.title || "未設定"}
- 学習内容: ${data.note || "まだ入力されていません"}

設定されたタイトル「${data.title || "未設定のタイトル"}」に基づいて、以下のサポートを提供してください：

1. **学習内容の構成提案**: このタイトルの学習を効果的に進めるための学習内容の構成やポイント
2. **関連タグの推測**: タイトルと過去の学習パターンから推測される適切なタグ
3. **学習のアドバイス**: ユニットの目標と過去の学習を踏まえた具体的な学習アドバイス

入力された学習内容がある場合は、それも分析して改善提案も含めてください。

以下のJSON形式で回答してください：
{
  "tags": ["推測タグ1", "推測タグ2", "推測タグ3", "推測タグ4"],
  "feedback": "学習内容の構成提案、学習のポイント、および具体的なアドバイス（200-300文字程度）"
}`;

    case 4: // タグ・リソース
      return `${baseContext}

【現在の入力情報】
- タイトル: ${data.title || "未入力"}
- 学習内容: ${data.note || "未入力"}
- 学習時間: ${data.learningTime || "未入力"}分
- 効果スコア: ${data.effectScore || "未入力"}
- 効果タイプ: ${data.effectType || "未入力"}

最終的なタグ提案と関連リソースを提案してください：

以下のJSON形式で回答してください：
{
  "tags": ["最終タグ1", "最終タグ2", "最終タグ3", "最終タグ4", "最終タグ5"],
  "resources": [
    {
      "title": "リソース名",
      "url": "URL",
      "description": "説明"
    }
  ],
  "feedback": "学習の総合的なフィードバックと次のステップへのアドバイス"
}`;

    default:
      return `${baseContext}

一般的な学習支援アドバイスを提供してください。`;
  }
}

// フォールバック用の基本的な提案生成
function generateFallbackSuggestions(
  step: number,
  data: any,
  unit: any,
  pastLogs: any[]
): AIAssistResponse["suggestions"] {
  const suggestions: AIAssistResponse["suggestions"] = {
    feedback:
      "AI提案機能で一時的な問題が発生しました。基本的な提案を表示しています。",
  };

  const today = new Date().toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });

  switch (step) {
    case 1:
      // ユニットタグを活用した学習内容提案
      const unitTags = unit.unitTags?.map((ut: any) => ut.tag.name) || [];

      suggestions.titles = [
        unitTags.length > 0
          ? `${unitTags[0]}の実践演習`
          : `${unit.title}の基礎練習`,
        `${unit.title}の応用課題`,
        pastLogs.length > 0
          ? `前回の続き: ${unit.title}発展編`
          : `${unit.title}の導入`,
        `${unit.title}のまとめと復習`,
      ];
      break;

    case 2:
      if (data.title) {
        // タイトルに基づいた学習タグを生成
        const titleWords = data.title.toLowerCase();
        const suggestedTags = [];

        // キーワードベースのタグ提案
        if (titleWords.includes("実践") || titleWords.includes("演習")) {
          suggestedTags.push("実践", "演習");
        }
        if (titleWords.includes("基礎") || titleWords.includes("導入")) {
          suggestedTags.push("基礎", "入門");
        }
        if (titleWords.includes("応用") || titleWords.includes("発展")) {
          suggestedTags.push("応用", "発展");
        }
        if (titleWords.includes("復習") || titleWords.includes("まとめ")) {
          suggestedTags.push("復習", "まとめ");
        }

        // ユニットタグも追加
        const unitTags = unit.unitTags?.map((ut: any) => ut.tag.name) || [];
        suggestedTags.push(...unitTags.slice(0, 2));

        suggestions.tags = [...new Set(suggestedTags)].slice(0, 4);
        suggestions.feedback = `「${data.title}」の学習を効果的に進めるため、段階的に内容を整理し、実践的な例や課題を含めることをお勧めします。`;
      } else {
        const contentKeywords = ["理解", "実践", "復習", "応用"];
        suggestions.tags = contentKeywords.slice(0, 3);
        suggestions.feedback =
          "まずタイトルを設定すると、より具体的な学習ガイドを提供できます。";
      }
      break;

    case 4:
      suggestions.tags = ["学習", "継続", "成長"];
      suggestions.resources = [
        {
          title: "学習リソース",
          url: "#",
          description: "関連する学習資料",
        },
      ];
      break;
  }

  return suggestions;
}
