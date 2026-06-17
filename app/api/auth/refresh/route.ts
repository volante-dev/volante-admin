import { NextResponse, type NextRequest } from "next/server";
import {
  getOAuthClientId,
  getOAuthClientSecret,
  getOAuthIssuer,
} from "@/lib/config";
import { createBasicAuthHeader } from "@/lib/oauth";
import {
  encodeSession,
  getSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

export async function GET(request: NextRequest) {
  const session = await getSession();
  const next = request.nextUrl.searchParams.get("next") ?? "/";

  if (!session?.refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientSecret = getOAuthClientSecret();
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (clientSecret) {
    headers.Authorization = createBasicAuthHeader(
      getOAuthClientId(),
      clientSecret,
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  if (!clientSecret) {
    body.set("client_id", getOAuthClientId());
  }

  const response = await fetch(`${getOAuthIssuer()}/oauth/token`, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const tokens = (await response.json()) as RefreshResponse;
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const now = Math.floor(Date.now() / 1000);
  const refreshedSession = {
    ...session,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? session.refreshToken,
    expiresAt: now + (tokens.expires_in ?? 3600),
    scope: tokens.scope ?? session.scope,
  };

  const redirectUrl = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const nextResponse = NextResponse.redirect(new URL(redirectUrl, request.url));
  nextResponse.cookies.set(
    SESSION_COOKIE,
    await encodeSession(refreshedSession),
    sessionCookieOptions(),
  );

  return nextResponse;
}
