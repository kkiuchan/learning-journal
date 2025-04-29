import { prisma } from "@/lib/prisma";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

// Noto Sans JP をGoogle Fontsから持ってくる
const fontUrl =
  "https://fonts.gstatic.com/s/notosansjp/v52/-F6ofjtqLzI2JPCgQBnw7HFQogg.woff2";

let fontData: ArrayBuffer | null = null;

async function fetchFont() {
  if (!fontData) {
    const res = await fetch(fontUrl);
    fontData = await res.arrayBuffer();
  }
  return fontData;
}

export default async function Image({ params }: { params: { id: string } }) {
  const unit = await prisma.unit.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  const font = await fetchFont();

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
            fontFamily: "Noto Sans JP, sans-serif",
            color: "#333",
          }}
        >
          Unit not found
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "Noto Sans JP",
            data: font,
            style: "normal",
            weight: 400,
          },
        ],
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
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "48px",
          fontFamily: "Noto Sans JP, sans-serif",
          color: "#000000",
        }}
      >
        {/* ロゴエリア */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            width={48}
            height={48}
            alt="Learning Journal"
            style={{ objectFit: "contain" }}
          />
          <span style={{ fontSize: 24, fontWeight: "bold" }}>
            Learning Journal
          </span>
        </div>

        {/* タイトル＋学習目標 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h1
            style={{
              fontSize: titleFontSize,
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {title}
          </h1>
          {unit.learningGoal && (
            <p
              style={{
                fontSize: 22,
                margin: 0,
                color: "#666",
                lineHeight: 1.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {unit.learningGoal}
            </p>
          )}
        </div>

        {/* ユーザー情報 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src={userImageSrc}
            width={64}
            height={64}
            style={{ borderRadius: "50%", objectFit: "cover" }}
            alt="user"
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 24, margin: 0 }}>
              {unit.user.name || "ユーザー"}
            </p>
            <p style={{ fontSize: 18, margin: 0, color: "#888" }}>
              Learning Journal
            </p>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: font,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
