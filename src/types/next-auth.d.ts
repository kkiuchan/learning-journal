import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    subscriptionStatus?: string | null;
    primaryAuthMethod: string;
  }

  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      image?: string | null;
      subscriptionStatus?: string | null;
      primaryAuthMethod: string;
      accounts?: {
        provider: string;
        providerAccountId: string;
        type: string;
        access_token: string;
        token_type: string;
        scope: string;
        expires_at: number;
      }[];
      hashedPassword?: string | null;
    };
  }
}
