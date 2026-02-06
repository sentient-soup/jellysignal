import { NextRequest, NextResponse } from "next/server";
import { authenticateWithJellyfin } from "@/lib/jellyfin";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const authResult = await authenticateWithJellyfin(username, password);

    if (!authResult) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession(
      authResult.User.Id,
      authResult.User.Name,
      authResult.User.Policy.IsAdministrator,
      authResult.AccessToken
    );

    const response = NextResponse.json({
      user: {
        id: authResult.User.Id,
        username: authResult.User.Name,
        isAdmin: authResult.User.Policy.IsAdministrator,
      },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
