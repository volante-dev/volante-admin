import { NextResponse } from "next/server";
import { getAppUrl, getAuthAppUrl } from "@/lib/config";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const authLogoutUrl = new URL("/logout", getAuthAppUrl());
  authLogoutUrl.searchParams.set("redirect", getAppUrl());

  const response = NextResponse.redirect(authLogoutUrl);
  response.cookies.delete(SESSION_COOKIE);

  return response;
}
