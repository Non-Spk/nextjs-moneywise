import { NextResponse } from "next/server";
import { auth } from "./auth";

/** Extract authenticated user ID from session, or return 401 response */
export async function getAuthUserId(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { userId: session.user.id };
}

/** Wrap API handler with try-catch to prevent stack trace leaks */
export function safeResponse(error: unknown): NextResponse {
  console.error("[API Error]", error);
  return NextResponse.json(
    { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
    { status: 500 }
  );
}
