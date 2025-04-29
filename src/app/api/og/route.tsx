import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// export const runtime = "edge";

// OG画像のサイズ
export const size = {
  width: 1200,
  height: 630,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // パラメータを取得
    const title = searchParams.get("title") ?? "No Title";
    const username = searchParams.get("username") ?? "Anonymous";
    const tags = searchParams.get("tags")?.split(",") ?? [];

    // 画像生成
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            fontFamily: "sans-serif",
            background: "linear-gradient(to bottom right, #ffffff, #f0f7f6)",
          }}
        >
          {/* 装飾的な要素 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "400px",
              height: "400px",
              background: "linear-gradient(45deg, #40B3A2, #3B5998)",
              borderRadius: "0 0 0 100%",
              opacity: 0.1,
            }}
          />

          <div
            style={{
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* ヘッダー部分 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "32px",
                background: "linear-gradient(135deg, #3B5998, #40B3A2)",
                padding: "12px 24px",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(59, 89, 152, 0.1)",
                width: "360px",
              }}
            >
              <img
                src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
                width={40}
                height={40}
                alt="Learning Journal"
                style={{
                  objectFit: "contain",
                  filter: "brightness(0) invert(1)",
                }}
              />
              <span
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                }}
              >
                Learning Journal
              </span>
            </div>

            {/* メインコンテンツ */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "24px",
                maxWidth: "90%",
              }}
            >
              <h1
                style={{
                  fontSize: title.length > 30 ? 40 : 48,
                  fontWeight: "bold",
                  color: "#3B5998",
                  margin: 0,
                  lineHeight: 1.4,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </h1>
              <div
                style={{
                  fontSize: 24,
                  color: "#40B3A2",
                  margin: 0,
                  lineHeight: 1.6,
                  opacity: 0.9,
                }}
              >
                {username}
              </div>
            </div>

            {/* フッター部分 */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "32px",
              }}
            >
              {tags.map((tag, i) => (
                <div
                  key={i}
                  style={{
                    background: "linear-gradient(135deg, #3B5998, #40B3A2)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "18px",
                    opacity: 0.9,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
