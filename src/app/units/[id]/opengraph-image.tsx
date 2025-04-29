import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }: { params: { id: string } }) {
  try {
    // APIを使用してユニット情報を取得
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/units/${params.id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch unit data");
    }

    const { data: unit } = await response.json();

    if (!unit) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fff",
              fontSize: 48,
              fontFamily: "sans-serif",
              color: "#333",
            }}
          >
            Unit not found
          </div>
        ),
        {
          ...size,
        }
      );
    }

    const title =
      unit.title.length > 30 ? unit.title.slice(0, 60) + "..." : unit.title;
    const titleFontSize = unit.title.length > 30 ? 40 : 48;
    const userImageSrc =
      unit.user.image ||
      `${process.env.NEXT_PUBLIC_APP_URL}/images/default-avatar.png`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
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
            {/* ヘッダー部分のラッパー */}
            <div style={{ display: "flex" }}>
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
                  fontSize: titleFontSize,
                  fontWeight: "bold",
                  color: "#3B5998",
                  margin: 0,
                  lineHeight: 1.4,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </h1>
              {unit.learningGoal && (
                <p
                  style={{
                    fontSize: 24,
                    color: "#40B3A2",
                    margin: 0,
                    lineHeight: 1.6,
                    opacity: 0.9,
                  }}
                >
                  {unit.learningGoal}
                </p>
              )}
            </div>

            {/* フッター部分 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "32px",
                padding: "16px 24px",
                background: "linear-gradient(to right, #3B5998, #40B3A2)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(59, 89, 152, 0.1)",
              }}
            >
              <img
                src={userImageSrc}
                width={56}
                height={56}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
                alt="user"
              />
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  {unit.user.name || "ユーザー"}
                </p>
                <p
                  style={{
                    fontSize: 16,
                    color: "#ffffff",
                    margin: 0,
                    opacity: 0.9,
                  }}
                >
                  Learning Journal
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            fontSize: 48,
            fontFamily: "sans-serif",
            color: "#333",
          }}
        >
          Error generating image
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
