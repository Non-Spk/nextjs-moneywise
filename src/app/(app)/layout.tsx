import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import ThemeProvider from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <ThemeProvider>
        <div className="flex min-h-screen bg-[var(--page-bg)]">
          <Sidebar />
          <main className="ml-[240px] flex-1 min-h-screen">{children}</main>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
