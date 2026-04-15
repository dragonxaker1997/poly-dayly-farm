import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.set("fm-access-token", "", { path: "/", maxAge: 0 });
  response.cookies.set("fm-refresh-token", "", { path: "/", maxAge: 0 });
  return response;
}
