import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit } from "./rate-limit";

const SESSION_MAX_AGE_SEC = 30 * 60; // 30 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        // Rate limit: 10 login attempts per email per 15 minutes
        const rl = checkRateLimit(`login:${email}`, { max: 10, windowSec: 900 });
        if (!rl.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          await compare("dummy-password", "$2a$12$000000000000000000000uGBYRB.58bDECTnViZwE5WDOROzVRedC");
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.loginAt = Date.now();
      }

      const loginAt = token.loginAt || 0;
      // No loginAt = old token before this feature, force re-login
      if (!loginAt || Date.now() - loginAt > SESSION_MAX_AGE_SEC * 1000) {
        return { expired: true } as typeof token;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.expired) {
        // Returning empty session - NextAuth will treat as unauthenticated
        return {} as typeof session;
      }
      if (session.user) {
        session.user.id = token.id as string;
      }
      // Pass expiry info to client for countdown
      session.expiresAt =
        ((token.loginAt as number) || 0) + SESSION_MAX_AGE_SEC * 1000;
      return session;
    },
  },
});
