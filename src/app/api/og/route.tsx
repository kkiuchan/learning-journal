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
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            padding: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            <h1
              style={{
                fontSize: "60px",
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.2,
                margin: "0 0 20px",
              }}
            >
              {title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "32px",
                  color: "#666",
                }}
              >
                by {username}
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {tags.map((tag, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#f0f0f0",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "24px",
                    color: "#666",
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
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
