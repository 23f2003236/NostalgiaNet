import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";

// Determine if Google OAuth is configured
const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID !== "placeholder_set_in_production";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      mode: { label: "Mode", type: "text" },
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      name: { label: "Name", type: "text" },
      invitedById: { label: "Invited By", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const mode = credentials.mode || "login";

      if (mode === "signup") {
        if (!credentials.name || credentials.name.trim().length < 2) {
          throw new Error("Please tell us your name");
        }
        if (credentials.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const existing = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (existing) {
          throw new Error("An account with this email already exists");
        }

        // Referral: validate inviter exists if invitedById was provided
        const invitedById =
          typeof credentials.invitedById === "string" && credentials.invitedById.length > 0
            ? credentials.invitedById
            : null;
        if (invitedById) {
          const inviter = await db.user.findUnique({
            where: { id: invitedById },
            select: { id: true },
          });
          if (!inviter) {
            // Invalid ref — drop silently, don't fail the signup
            // (otherwise a bad ref link would block account creation)
          }
        }

        const user = await db.user.create({
          data: {
            email: credentials.email,
            name: credentials.name.trim(),
            password: await hashPassword(credentials.password),
            invitedById: invitedById || null,
          },
        });

        // Reward the inviter: shave 3 days off their oldest SEALED vault,
        // capped so the unlock date can't move more than 30 days earlier than
        // 24h from now (prevents instant-unlock abuse).
        if (invitedById) {
          try {
            const now = new Date();
            const oldestActive = await db.vault.findFirst({
              where: {
                userId: invitedById,
                isSealed: true,
                unlockAt: { gt: now },
              },
              orderBy: { unlockAt: "asc" },
            });
            if (oldestActive) {
              const newUnlock = new Date(oldestActive.unlockAt.getTime() - 3 * 24 * 60 * 60 * 1000);
              // Floor: 24h from now (so a 2-day-away vault becomes 1-day-away, not 1-minute-away)
              const floor = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              const finalUnlock = newUnlock < floor ? floor : newUnlock;

              if (finalUnlock < oldestActive.unlockAt) {
                await db.vault.update({
                  where: { id: oldestActive.id },
                  data: { unlockAt: finalUnlock },
                });
                // Notify the inviter about their reward
                await db.notification.create({
                  data: {
                    userId: invitedById,
                    type: "UNLOCK_REMINDER",
                    title: `Your capsule "${oldestActive.title}" just got 3 days closer!`,
                    body: `Someone joined NostalgiaNet++ with your referral. Unlock moved up to ${finalUnlock.toLocaleDateString()}.`,
                    link: `/?vault=${oldestActive.id}`,
                  },
                });
              }
            }
          } catch (e) {
            // Reward is best-effort — never block signup
            console.error("[referral reward] failed", e);
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
        };
      }

      // login
      const user = await db.user.findUnique({
        where: { email: credentials.email },
      });
      if (!user || !user.password) {
        throw new Error("Invalid email or password");
      }
      if (!(await verifyPassword(credentials.password, user.password))) {
        throw new Error("Invalid email or password");
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.avatar,
      };
    },
  }),
];

if (hasGoogle) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-only-secret-please-replace",
  pages: {
    signIn: "/?auth=login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Upsert user into our DB on Google sign-in
        const existing = await db.user.findUnique({
          where: { email: user.email },
        });
        if (!existing) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split("@")[0],
              avatar: user.image || null,
              password: null,
            },
          });
        } else if (!existing.avatar && user.image) {
          await db.user.update({
            where: { id: existing.id },
            data: { avatar: user.image },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // First login — hydrate full token from DB
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
            plan: true,
            role: true,
          },
        });
        if (dbUser) {
          token.uid = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.avatar = dbUser.avatar;
          token.bio = dbUser.bio;
          token.plan = dbUser.plan;
          token.role = dbUser.role;
        }
      } else if (token.uid) {
        // Session refresh (update() called) — re-fetch mutable fields so
        // avatar/name/bio changes propagate to all clients immediately.
        const dbUser = await db.user.findUnique({
          where: { id: token.uid as string },
          select: { name: true, avatar: true, bio: true, plan: true, role: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.avatar = dbUser.avatar;
          token.bio = dbUser.bio;
          token.plan = dbUser.plan;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) || "";
        session.user.avatar = (token.avatar as string) || null;
        session.user.bio = (token.bio as string) || null;
        session.user.plan = (token.plan as string) || "FREE";
        session.user.role = (token.role as string) || "USER";
      }
      return session;
    },
  },
};
