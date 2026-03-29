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

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <ThemeProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-60 flex-1 min-h-screen">{children}</main>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
