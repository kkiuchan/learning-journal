import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string | null;
    email: string;
    subscriptionStatus: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      subscriptionStatus: string | null;
    };
  }
}
