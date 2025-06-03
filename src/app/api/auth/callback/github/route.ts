import { withApiSecurity } from "@/lib/api-security";
import { createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

// JWT用の秘密鍵
const getJwtSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

// JWTトークンの生成
async function generateJWT(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const secret = getJwtSecret();

  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

// GitHubからアクセストークンを取得
async function getGitHubAccessToken(code: string, redirectUri: string) {
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error("GitHubトークンの取得に失敗しました");
  }

  return await tokenResponse.json();
}

// GitHubからユーザー情報を取得
async function getGitHubUserInfo(accessToken: string) {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "LearningJournal",
    },
  });

  if (!userResponse.ok) {
    throw new Error("GitHubユーザー情報の取得に失敗しました");
  }

  const user = await userResponse.json();

  // GitHubのメールアドレスを取得（プライベートの場合は別途取得）
  if (!user.email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "LearningJournal",
      },
    });

    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary);
      user.email = primaryEmail?.email || emails[0]?.email;
    }
  }

  return user;
}

// 統一GitHub OAuthコールバック処理
async function handleGitHubCallback(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      throw new Error(`GitHub OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error("認証コードが見つかりません");
    }

    // stateパラメータをデコードして判別
    let platformInfo: { platform: string; expoRedirectUri?: string } = {
      platform: "web",
    };
    if (state) {
      try {
        platformInfo = JSON.parse(decodeURIComponent(state));
      } catch (e) {
        console.warn("Failed to parse state parameter:", e);
      }
    }

    // GitHubからアクセストークンを取得
    const redirectUri = `${process.env.NEXTAUTH_URL || "https://learning-journal-app.com"}/api/auth/callback/github`;
    const tokenData = await getGitHubAccessToken(code, redirectUri);

    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
    }

    // GitHubからユーザー情報を取得
    const githubUser = await getGitHubUserInfo(tokenData.access_token);

    if (!githubUser.email) {
      return createErrorResponse(
        "GitHubのメールアドレスが取得できませんでした",
        400
      );
    }

    // 既存のユーザーを検索または作成
    const existingUser = await prisma.user.findUnique({
      where: { email: githubUser.email },
      include: {
        accounts: true,
      },
    });

    let user;

    if (existingUser) {
      // 既存ユーザーの場合、GitHubアカウントが紐づいているかチェック
      const hasGitHubAccount = existingUser.accounts.some(
        (acc) => acc.provider === "github"
      );

      if (!hasGitHubAccount) {
        // GitHubアカウントを追加
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "github",
            providerAccountId: githubUser.id.toString(),
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
          },
        });
      }

      // 既存ユーザー情報を更新
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: githubUser.name || githubUser.login,
          image: githubUser.avatar_url,
          primaryAuthMethod: "github",
        },
      });
    } else {
      // 新規ユーザー作成
      user = await prisma.user.create({
        data: {
          name: githubUser.name || githubUser.login,
          email: githubUser.email,
          image: githubUser.avatar_url,
          primaryAuthMethod: "github",
          emailVerified: new Date(),
          accounts: {
            create: {
              type: "oauth",
              provider: "github",
              providerAccountId: githubUser.id.toString(),
              access_token: tokenData.access_token,
              token_type: tokenData.token_type,
              scope: tokenData.scope,
            },
          },
        },
      });
    }

    // プラットフォーム別レスポンス
    if (
      platformInfo.platform === "mobile" ||
      platformInfo.platform === "mobile_polling"
    ) {
      // モバイル用：WebBrowser向けにクエリパラメータでレスポンス
      const token = await generateJWT({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        primaryAuthMethod: user.primaryAuthMethod,
        emailVerified: user.emailVerified,
      };

      const responseData = {
        user: userData,
        token,
        message: "GitHubログインが成功しました",
      };

      if (platformInfo.platform === "mobile_polling") {
        // ポーリング方式：認証データをサーバーに一時保存
        const sessionId = (platformInfo as any).sessionId;

        if (sessionId) {
          // セッション管理用の簡易ストレージ（Redis推奨だが、開発では一時ファイル）
          const fs = require("fs");
          const path = require("path");
          const tempDir = path.join("/tmp", "oauth-sessions");

          try {
            // ディレクトリを作成（存在しない場合）
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            // セッションデータを保存（5分間で自動削除）
            const sessionFile = path.join(tempDir, `${sessionId}.json`);
            fs.writeFileSync(
              sessionFile,
              JSON.stringify({
                ...responseData,
                timestamp: Date.now(),
                expires: Date.now() + 300000, // 5分後に期限切れ
              })
            );

            console.log(`📁 セッション保存: ${sessionId}`);
          } catch (error) {
            console.error("セッション保存エラー:", error);
          }
        }

        // ポーリング方式では成功ページにリダイレクト
        return NextResponse.redirect(
          new URL(
            "/auth/mobile-success?message=" +
              encodeURIComponent(
                "認証が完了しました。アプリに戻ってください。"
              ),
            process.env.NEXTAUTH_URL || "https://www.learning-journal-app.com"
          )
        );
      } else {
        // 従来のモバイル方式（WebBrowser）
        // モバイル用リダイレクトURL決定
        let callbackUrl: string;

        // stateからexpoRedirectUriが提供されている場合はそれを使用
        if ((platformInfo as any).expoRedirectUri) {
          const dataParam = encodeURIComponent(JSON.stringify(responseData));
          callbackUrl = `${(platformInfo as any).expoRedirectUri}?data=${dataParam}`;
        } else {
          // フォールバック：環境別デフォルト
          const isDevelopment = process.env.NODE_ENV === "development";

          if (isDevelopment) {
            // 開発環境：Expo Go用（IP動的対応）
            callbackUrl = `exp://192.168.1.10:8081/--/auth/github/callback?data=${encodeURIComponent(JSON.stringify(responseData))}`;
          } else {
            // 本番環境：Universal Links優先
            const dataParam = encodeURIComponent(JSON.stringify(responseData));
            callbackUrl = `https://learning-journal-app.com/mobile/auth/github/callback?data=${dataParam}`;
          }
        }

        return NextResponse.redirect(callbackUrl);
      }
    } else {
      // Web用：既存のNextAuthフローにリダイレクト
      return NextResponse.redirect(
        new URL(
          "/dashboard?auth=success",
          process.env.NEXTAUTH_URL || "https://www.learning-journal-app.com"
        )
      );
    }
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "GitHub認証に失敗しました";

    // エラー時もプラットフォーム別対応
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    let platformInfo: { platform: string; expoRedirectUri?: string } = {
      platform: "web",
    };

    if (state) {
      try {
        platformInfo = JSON.parse(decodeURIComponent(state));
      } catch (e) {
        // stateの解析に失敗した場合はWebとして扱う
      }
    }

    if (
      platformInfo.platform === "mobile" ||
      platformInfo.platform === "mobile_polling"
    ) {
      // モバイルエラー用：WebBrowserがキャッチできるエラーレスポンス
      let callbackUrl: string;

      // stateからexpoRedirectUriが提供されている場合はそれを使用
      if ((platformInfo as any).expoRedirectUri) {
        callbackUrl = `${(platformInfo as any).expoRedirectUri}?error=${encodeURIComponent(errorMessage)}`;
      } else {
        // フォールバック：環境別デフォルト
        const isDevelopment = process.env.NODE_ENV === "development";

        if (isDevelopment) {
          callbackUrl = `exp://192.168.1.10:8081/--/auth/github/callback?error=${encodeURIComponent(errorMessage)}`;
        } else {
          // 本番環境：Universal Links優先
          callbackUrl = `https://learning-journal-app.com/mobile/auth/github/callback?error=${encodeURIComponent(errorMessage)}`;
        }
      }

      return NextResponse.redirect(callbackUrl);
    } else {
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${encodeURIComponent(errorMessage)}`,
          process.env.NEXTAUTH_URL || "https://www.learning-journal-app.com"
        )
      );
    }
  }
}

// GET: GitHub OAuth Callback
export const GET = withApiSecurity(handleGitHubCallback, {
  rateLimit: {
    limit: 10, // 1分間に10回まで
    windowMs: 60000,
  },
});
