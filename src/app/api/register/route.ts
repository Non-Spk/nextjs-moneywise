import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeString, isValidEmail } from "@/lib/validation";
import { safeResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 registrations per IP per 15 minutes
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, { max: 5, windowSec: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "คำขอมากเกินไป กรุณารอสักครู่" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();
    const name = sanitizeString(body.name, 100);
    const email = sanitizeString(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "รหัสผ่านยาวเกินไป" },
        { status: 400 }
      );
    }

    // Check if user already exists - use generic message to prevent email enumeration
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Don't return userId to prevent information leakage
    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ" },
      { status: 201 }
    );
  } catch (err) {
    return safeResponse(err);
  }
}
