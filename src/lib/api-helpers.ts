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
