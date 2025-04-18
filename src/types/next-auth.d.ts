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
      name: string;
      email: string;
      image?: string;
      subscriptionStatus?: string;
      primaryAuthMethod?: string;
      accounts?: {
        provider: string;
        providerAccountId: string;
      }[];
    };
  }
}
