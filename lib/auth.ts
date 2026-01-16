import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db, users, hostInvitations } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import type { UserRole } from "@/lib/types/database";

// Get admin emails from environment variable
const getAdminEmails = (): string[] => {
  const emails = process.env.ADMIN_EMAILS || "";
  return emails.split(",").map((email) => email.trim().toLowerCase());
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const adminEmails = getAdminEmails();
      const role: UserRole = adminEmails.includes(email) ? "admin" : "guest";

      // Check for pending invitation
      const [pendingInvite] = await db
        .select()
        .from(hostInvitations)
        .where(
          and(
            eq(hostInvitations.email, email),
            eq(hostInvitations.status, "pending")
          )
        )
        .limit(1);

      // Check if user already has an accepted invitation
      const [acceptedInvite] = await db
        .select()
        .from(hostInvitations)
        .where(
          and(
            eq(hostInvitations.email, email),
            eq(hostInvitations.status, "accepted")
          )
        )
        .limit(1);

      const shouldBeHost = !!pendingInvite || !!acceptedInvite;

      // Upsert user in database
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        await db.insert(users).values({
          email,
          name: user.name || null,
          avatar: user.image || null,
          role,
          isHost: shouldBeHost,
        });
      } else {
        await db
          .update(users)
          .set({
            name: user.name || existingUser[0].name,
            avatar: user.image || existingUser[0].avatar,
            isHost: existingUser[0].isHost || shouldBeHost,
            updatedAt: new Date(),
          })
          .where(eq(users.email, email));
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.email) {
        const email = user.email.toLowerCase();
        const adminEmails = getAdminEmails();
        token.role = adminEmails.includes(email) ? "admin" : "guest";
        token.email = email;

        // Fetch isHost from database
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        token.isHost = dbUser?.isHost || false;
      }

      // Refresh isHost on session update
      if (trigger === "update" && token.email) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email as string))
          .limit(1);
        token.isHost = dbUser?.isHost || false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.isHost = token.isHost as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

// Type augmentation for next-auth
declare module "next-auth" {
  interface User {
    role?: UserRole;
    isHost?: boolean;
  }
  interface Session {
    user: {
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      isHost: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    email?: string;
    isHost?: boolean;
  }
}
