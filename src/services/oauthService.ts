import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { API_CONFIG } from "../config/api";
import { AuthResponse } from "../types";
import { authService } from "./auth";

// WebBrowserの設定を完了
WebBrowser.maybeCompleteAuthSession();

// OAuthプロバイダーの設定
const OAUTH_CONFIG = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["openid", "profile", "email"],
  },
  // GitHub設定は一時的にコメントアウト
  // github: {
  //   clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "",
  //   authUrl: "https://github.com/login/oauth/authorize",
  //   scopes: ["user:email"],
  // },
};

class OAuthService {
  // Google OAuth - 改善版
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      console.log("🔍 Google OAuth: 認証を開始します...");

      // リダイレクトURIを生成
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      console.log("🔗 Redirect URI:", redirectUri);

      // AuthRequestを作成
      const request = new AuthSession.AuthRequest({
        clientId: OAUTH_CONFIG.google.clientId,
        scopes: OAUTH_CONFIG.google.scopes,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: "offline",
          prompt: "consent",
        },
      });

      // 認証URLを生成
      const authUrl = await request.makeAuthUrlAsync({
        authorizationEndpoint: OAUTH_CONFIG.google.authUrl,
      });

      console.log("🔗 Google認証URL:", authUrl);

      // WebBrowserで認証を開始
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log("🔍 認証結果:", result);

      if (result.type !== "success") {
        throw new Error("Google認証がキャンセルされました");
      }

      // 認証コードを取得
      const url = new URL(result.url);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        throw new Error(`認証エラー: ${error}`);
      }

      if (!code) {
        throw new Error("認証コードが取得できませんでした");
      }

      console.log("✅ 認証コード取得成功");

      // Googleからアクセストークンを取得
      const tokenResponse = await this.exchangeCodeForToken(code, redirectUri);

      // バックエンドで認証処理
      const authData = await this.authenticateWithBackend(
        tokenResponse.access_token
      );

      // トークンとユーザー情報を保存
      await authService.setToken(authData.token);
      await authService.setUser(authData.user);

      console.log("✅ Google認証が完了しました:", authData.user);

      return authData;
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      throw new Error(error.message || "Google認証に失敗しました");
    }
  }

  // Googleアクセストークン取得
  private async exchangeCodeForToken(code: string, redirectUri: string) {
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: OAUTH_CONFIG.google.clientId,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange error:", errorData);
        throw new Error("Googleアクセストークンの取得に失敗しました");
      }

      const tokenData = await tokenResponse.json();
      console.log("✅ アクセストークン取得成功");

      return tokenData;
    } catch (error: any) {
      console.error("Token exchange error:", error);
      throw new Error("アクセストークンの取得に失敗しました");
    }
  }

  // バックエンド認証
  private async authenticateWithBackend(
    accessToken: string
  ): Promise<AuthResponse> {
    try {
      const authResponse = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.MOBILE_GOOGLE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: accessToken,
          }),
        }
      );

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        console.error("Backend auth error:", errorData);
        throw new Error(errorData.error || "バックエンド認証に失敗しました");
      }

      const authData = await authResponse.json();
      console.log("✅ バックエンド認証成功");

      return authData;
    } catch (error: any) {
      console.error("Backend authentication error:", error);
      throw new Error("バックエンド認証に失敗しました");
    }
  }

  // GitHub OAuth - 一時的に無効化
  async signInWithGitHub(): Promise<AuthResponse> {
    throw new Error(
      "GitHub認証は現在無効化されています。Google認証をご利用ください。"
    );
  }

  // 開発環境用：ポーリング方式 - 一時的に無効化
  private async signInWithGitHubPolling(): Promise<AuthResponse> {
    throw new Error("GitHub認証は現在無効化されています。");
  }

  // 本番環境用：Custom Scheme方式 - 一時的に無効化
  private async signInWithGitHubCustomScheme(): Promise<AuthResponse> {
    throw new Error("GitHub認証は現在無効化されています。");
  }
}

export const oauthService = new OAuthService();
