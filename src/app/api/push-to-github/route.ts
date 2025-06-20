import { getCurrentUserUnified } from "@/lib/auth-helpers";
import { Buffer } from "buffer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 認証チェック
  const user = await getCurrentUserUnified();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, content } = await req.json();

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${dateStr}-${title}.md`.replace(/\s+/g, "_");
  const path = `logs/${filename}`;

  const base64Content = Buffer.from(content).toString("base64");

  const res = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `Add: ${title}`,
        content: base64Content,
        branch: process.env.GITHUB_BRANCH,
        committer: {
          name: process.env.GITHUB_USERNAME,
          email: process.env.GITHUB_EMAIL,
        },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    console.error("GitHub API Error:", error);
    return NextResponse.json(
      { error: `GitHub API Error: ${error.message || "Unknown error"}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({ success: true, url: data.content.html_url });
}
