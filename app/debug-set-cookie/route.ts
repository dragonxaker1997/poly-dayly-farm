import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/debug-session", request.url), { status: 303 });

  response.cookies.set("farm-debug-cookie", "ok", {
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 60 * 10
  });

  return response;
}
