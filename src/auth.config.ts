import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import type { Account, Session } from "next-auth";
import { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
// import Twitter from "next-auth/providers/twitter";

import { prisma } from "./lib/prisma";

const adapter = PrismaAdapter(prisma);

export const authConfig = {
  adapter,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            accounts: true,
          },
        });

        // 新規ユーザーの場合
        if (!user) {
          // パスワードをハッシュ化
          const hashedPassword = await bcryptjs.hash(credentials.password, 12);

          // 新規ユーザーを作成
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0], // メールアドレスの@より前の部分を名前として使用
              hashedPassword,
              primaryAuthMethod: "email",
            },
          });

          return newUser;
        }

        // パスワード認証ユーザーの場合
        if (user.hashedPassword) {
          const isValid = await bcryptjs.compare(
            credentials.password,
            user.hashedPassword
          );
          if (isValid) {
            return user;
          }
        }

        // 外部認証ユーザーの場合
        if (user.accounts && user.accounts.length > 0) {
          // 利用可能な外部認証プロバイダーを取得
          const availableProviders = user.accounts.map(
            (account) => account.provider
          );
          throw new Error(JSON.stringify({ availableProviders }));
        }

        return null;
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
      profile(profile) {
        console.log("Google Profile:", profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          primaryAuthMethod: "google",
        };
      },
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile) {
        console.log("GitHub Profile - 生データ:", profile);
        const userProfile = {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email || `${profile.login}@github.com`,
          image: profile.avatar_url,
          primaryAuthMethod: "github",
        };
        console.log("GitHub Profile - 変換後:", userProfile);
        return userProfile;
      },
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
          primaryAuthMethod: "discord",
        };
      },
    }),
    // Twitter({
    //   clientId: process.env.TWITTER_CLIENT_ID!,
    //   clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    //   version: "2.0",
    //   profile(profile: {
    //     id: string;
    //     id_str?: string;
    //     name: string;
    //     email?: string;
    //     screen_name?: string;
    //     username?: string;
    //     profile_image_url_https?: string;
    //     profile_image_url?: string;
    //   }) {
    //     return {
    //       id: profile.id_str || profile.id,
    //       name: profile.name,
    //       email:
    //         profile.email ||
    //         `${profile.screen_name || profile.username}@twitter.com`,
    //       image: profile.profile_image_url_https || profile.profile_image_url,
    //       primaryAuthMethod: "twitter",
    //     };
    //   },
    // }),
  ],
  callbacks: {
    // async signIn({
    //   user,
    //   account,
    // }: {
    //   user: {
    //     id: string;
    //     name?: string | null;
    //     email?: string | null;
    //     image?: string | null;
    //     primaryAuthMethod: string;
    //   };
    //   account: Account | null;
    // }) {
    //   if (account?.provider === "credentials") {
    //     return true;
    //   }

    //   // 既存のユーザーを検索
    //   const existingUser = await prisma.user.findUnique({
    //     where: { email: user.email || "" },
    //     include: {
    //       accounts: true,
    //     },
    //   });

    //   // 既存のユーザーが存在する場合
    //   if (existingUser) {
    //     // 新しい認証方法が既に登録されているかチェック
    //     const hasProvider = existingUser.accounts.some(
    //       (acc) => acc.provider === account?.provider
    //     );

    //     if (!hasProvider && account) {
    //       // 新しい認証方法を追加
    //       await prisma.account.create({
    //         data: {
    //           userId: existingUser.id,
    //           type: account.type,
    //           provider: account.provider,
    //           providerAccountId: account.providerAccountId,
    //           access_token: account.access_token,
    //           token_type: account.token_type,
    //           scope: account.scope,
    //           expires_at: account.expires_at,
    //         },
    //       });
    //     }

    //     // 既存のユーザー情報を使用し、primaryAuthMethodを更新
    //     user.id = existingUser.id;
    //     user.primaryAuthMethod =
    //       account?.provider || existingUser.primaryAuthMethod;

    //     // ユーザーのprimaryAuthMethodを更新
    //     await prisma.user.update({
    //       where: { id: existingUser.id },
    //       data: { primaryAuthMethod: user.primaryAuthMethod },
    //     });
    //   }

    //   return true;
    // },
    async signIn({
      user,
      account,
    }: {
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        primaryAuthMethod: string;
      };
      account: Account | null;
    }) {
      console.log(
        "[signIn] Start - provider:",
        account?.provider,
        "email:",
        user.email
      );

      if (account?.provider === "credentials") {
        console.log("[signIn] credentials login - return true");
        return true;
      }

      console.log("[signIn] Finding existing user by email...");
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email || "" },
        include: {
          accounts: true,
        },
      });
      console.log("[signIn] existingUser:", existingUser?.id || "not found");

      if (existingUser) {
        console.log("[signIn] Checking if provider is already linked...");

        const hasProvider = existingUser.accounts.some(
          (acc) => acc.provider === account?.provider
        );
        console.log("[signIn] hasProvider:", hasProvider);

        if (!hasProvider && account) {
          console.log("[signIn] Linking new provider:", account.provider);
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              expires_at: account.expires_at,
            },
          });
          console.log("[signIn] Provider linked successfully");
        }

        console.log("[signIn] Updating primaryAuthMethod...");
        user.id = existingUser.id;
        user.primaryAuthMethod =
          account?.provider || existingUser.primaryAuthMethod;

        await prisma.user.update({
          where: { id: existingUser.id },
          data: { primaryAuthMethod: user.primaryAuthMethod },
        });
        console.log("[signIn] primaryAuthMethod updated");
      } else {
        console.log("[signIn] No existing user found.");
      }

      console.log("[signIn] End - returning true");
      return true;
    },
    async jwt({
      token,
      account,
      user,
    }: {
      token: JWT;
      account: Account | null;
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        primaryAuthMethod: string;
      };
    }) {
      if (process.env.NODE_ENV === "development") {
        console.log("JWT Callback - Input:", { token, account, user });
      }

      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          userId: user.id,
          primaryAuthMethod: account.provider,
        };
      }

      if (process.env.NODE_ENV === "development") {
        console.log("既存のトークンを使用:", token);
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (process.env.NODE_ENV === "development") {
        console.log("Session Callback - Input:", { session, token });
      }

      if (token) {
        const newSession = {
          ...session,
          user: {
            ...session.user,
            id: token.userId as string,
            primaryAuthMethod: token.primaryAuthMethod as string,
            name: token.name as string | null,
            email: token.email as string,

            image: token.picture as string | null,
            accounts: await prisma.account.findMany({
              where: {
                userId: token.userId as string,
              },
            }),
          },
        };
        console.log("Session Callback - 新しいセッション:", newSession);
        return newSession;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: true, // デバッグモードを有効化
  events: {
    async signIn() {
      console.log("Cookie設定 - 環境:", process.env.NODE_ENV);
      console.log(
        "Cookie設定 - secure:",
        process.env.NODE_ENV === "production"
      );
    },
  },
} satisfies NextAuthOptions;
