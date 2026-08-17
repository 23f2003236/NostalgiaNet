import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      bio?: string | null;
      plan?: string;
      role?: string; // USER | ADMIN
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    avatar?: string | null;
    bio?: string | null;
    plan?: string;
    role?: string;
  }
}
