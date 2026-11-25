
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  requireAdmin,
  sessionCookie,
  verifySessionToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  const authorized = await requireAdmin().catch(() => false);

  if (!authorized) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Please login again." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie.name)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Please login again." },
      { status: 401 }
    );
  }

  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Invalid session." },
      { status: 401 }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request data." },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword, confirmPassword } = body;

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return NextResponse.json(
      { success: false, message: "All password fields are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < 10 || newPassword.length > 128) {
    return NextResponse.json(
      { success: false, message: "New password must be 10–128 characters." },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, message: "New passwords do not match." },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { success: false, message: "Choose a different new password." },
      { status: 400 }
    );
  }

  try {
    const users = await sql`
      SELECT id, password_hash, password_salt
      FROM admin_users
      WHERE id = ${session.userId}
        AND session_version = ${session.sessionVersion}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Admin account not found." },
        { status: 404 }
      );
    }

    const admin = users[0];

    const validPassword = verifyPassword(
      currentPassword,
      admin.password_salt,
      admin.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const newSalt = randomBytes(32).toString("hex");
    const newHash = hashPassword(newPassword, newSalt);

    await sql`
      UPDATE admin_users
      SET password_hash = ${newHash},
          password_salt = ${newSalt},
          session_version = session_version + 1
      WHERE id = ${session.userId}
    `;

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });

    response.cookies.set(sessionCookie.name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Password update error:", error);

    return NextResponse.json(
      { success: false, message: "Password change failed." },
      { status: 500 }
    );
  }
}
