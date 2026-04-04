"use client";

import { SessionProvider as NextAuthSessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const logoutTriggered = useRef(false);

  useEffect(() => {
    // Don't check on login page
    if (pathname === "/login") return;

    // If session check completed and there's no user, force logout
    if (status === "unauthenticated" && !logoutTriggered.current) {
      logoutTriggered.current = true;
      signOut({ callbackUrl: "/login" });
      return;
    }

    // If session exists, check expiresAt
    if (status === "authenticated" && session) {
      const expiresAt = (session as unknown as { expiresAt?: number }).expiresAt;
      if (expiresAt && Date.now() > expiresAt && !logoutTriggered.current) {
        logoutTriggered.current = true;
        signOut({ callbackUrl: "/login" });
        return;
      }

      // Set a timer to auto-logout at exact expiry time
      if (expiresAt) {
        const remaining = expiresAt - Date.now();
        if (remaining > 0) {
          const timer = setTimeout(() => {
            if (!logoutTriggered.current) {
              logoutTriggered.current = true;
              signOut({ callbackUrl: "/login" });
            }
          }, remaining);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [session, status, pathname]);

  // Reset flag when session changes (e.g. re-login)
  useEffect(() => {
    if (status === "authenticated") {
      logoutTriggered.current = false;
    }
  }, [status]);

  return <>{children}</>;
}

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider
      refetchInterval={60}
      refetchOnWindowFocus={true}
    >
      <SessionGuard>{children}</SessionGuard>
    </NextAuthSessionProvider>
  );
}
