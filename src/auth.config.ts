import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import type { Account, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";

import { z } from "zod";
import { prisma } from "./lib/prisma";

async function getUser(email: string) {
  return await prisma.user.findUnique({
    where: { email: email },
  });
}

const adapter = PrismaAdapter(prisma);

export const authConfig = {
  adapter,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcryptjs.compare(
            password,
            user.hashedPassword || ""
          );
          if (passwordsMatch) return user;
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
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email || `${profile.login}@github.com`,
          image: profile.avatar_url,
          primaryAuthMethod: "github",
        };
      },
    }),
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      profile(profile: any) {
        return {
          id: profile.id_str || profile.id,
          name: profile.name,
          email:
            profile.email ||
            `${profile.screen_name || profile.username}@twitter.com`,
          image: profile.profile_image_url_https || profile.profile_image_url,
          primaryAuthMethod: "twitter",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      account,
      user,
    }: {
      token: JWT;
      account: Account | null;
      user: any;
    }) {
      console.log("JWT Callback - Input:", { token, account, user });

      if (account && user) {
        const newToken = {
          ...token,
          accessToken: account.access_token,
          userId: user.id,
          primaryAuthMethod: user.primaryAuthMethod,
          name: user.name,
          email: user.email,
          picture: user.image,
        };
        console.log("JWT Callback トークンいい感じかな？:", newToken);
        return newToken;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("Session Callback - Input:", { session, token });

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
          },
        };
        console.log("Session Callback セッションいい感じかな？:", newSession);
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
        secure: false,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: false,
      },
    },
  },
  debug: true, // デバッグモードを有効化
};
