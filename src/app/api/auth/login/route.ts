
import { NextResponse } from "next/server";
import {
  authenticateAdmin,
  createSessionToken,
  sessionCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { username, password } = body;

    // Validate input
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 }
      );
    }

    // Check session secret
    if (!process.env.SESSION_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "Session security is not configured",
        },
        { status: 500 }
      );
    }

    const cleanUsername = username.trim();

    // Authenticate admin
    const admin = await authenticateAdmin(
      cleanUsername,
      password
    );

    // Temporary diagnostic information
    console.log("LOGIN CHECK:", {
      usernameReceived: cleanUsername,
      adminFound: Boolean(admin),
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    // Create session token
    const token = createSessionToken(
      admin.id,
      admin.sessionVersion
    );

    // Successful login response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    // Set secure session cookie
    response.cookies.set(sessionCookie.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionCookie.maxAge,
    });

    return response;

  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login request failed",
      },
      { status: 500 }
    );
  }
}
