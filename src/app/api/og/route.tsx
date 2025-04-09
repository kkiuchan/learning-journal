import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// OG画像のサイズ
export const size = {
  width: 1200,
  height: 630,
};

export async function GET(req: NextRequest) {
  try {
    // URLからパラメータを取得
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Learning Journal";
    const username = searchParams.get("username") || "";
    const tags = searchParams.get("tags") || "";

    // フォントデータをロード
    const interBold = await fetch(
      new URL("../../../../public/fonts/Inter-Bold.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    const interRegular = await fetch(
      new URL("../../../../public/fonts/Inter-Regular.ttf", import.meta.url)
    ).then((res) => res.arrayBuffer());

    // 画像生成
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            backgroundImage:
              "linear-gradient(to bottom right, #f0f9ff, #e0f2fe)",
            padding: "40px 60px",
          }}
        >
          {/* アプリロゴ */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              left: "40px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="40" height="40" rx="8" fill="#3B82F6" />
              <path
                d="M12 22L20 14L28 22M14 20V28H26V20"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#0F172A",
              }}
            >
              Learning Journal
            </span>
          </div>

          {/* ユニットタイトル */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "20px",
              width: "100%",
              maxWidth: "900px",
            }}
          >
            <h1
              style={{
                fontSize: 52,
                fontWeight: "bold",
                color: "#0F172A",
                textAlign: "center",
                lineHeight: 1.2,
                margin: 0,
                marginBottom: "20px",
              }}
            >
              {title}
            </h1>

            {/* ユーザー名とタグ */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "10px",
                gap: "10px",
              }}
            >
              {username && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 24,
                    color: "#475569",
                  }}
                >
                  <span>by {username}</span>
                </div>
              )}

              {tags && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >
                  {tags.split(",").map((tag, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "#E0F2FE",
                        color: "#0369A1",
                        borderRadius: "20px",
                        fontSize: 16,
                        padding: "6px 12px",
                      }}
                    >
                      {tag.trim()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* フッター */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "calc(100% - 80px)",
            }}
          >
            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "12px 24px",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                color: "#64748B",
                fontSize: 18,
              }}
            >
              学習を記録・共有 | learningjournal.app
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "Inter",
            data: interBold,
            style: "normal",
            weight: 700,
          },
          {
            name: "Inter",
            data: interRegular,
            style: "normal",
            weight: 400,
          },
        ],
      }
    );
  } catch (error) {
    console.error("OG画像生成エラー:", error);
    return new Response("OG画像の生成に失敗しました", { status: 500 });
  }
}
