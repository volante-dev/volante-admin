import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import {
  getOAuthClientId,
  getOAuthClientSecret,
  getOAuthIssuer,
  getOAuthRedirectUri,
} from "@/lib/config";
import {
  createBasicAuthHeader,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from "@/lib/oauth";
import {
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  type AdminSession,
} from "@/lib/session";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  jwks ??= createRemoteJWKSet(
    new URL(`${getOAuthIssuer()}/.well-known/jwks.json`),
  );
  return jwks;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const expectedNonce = request.cookies.get(OAUTH_NONCE_COOKIE)?.value;
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  const requestedNext = request.cookies.get("volante_login_next")?.value ?? "/";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/";

  if (error) {
    return redirectWithError(request, error);
  }

  if (!code || !state || state !== expectedState || !verifier) {
    return redirectWithError(request, "invalid_oauth_state");
  }

  const tokenResponse = await exchangeCodeForTokens(code, verifier);
  if (
    tokenResponse.error ||
    !tokenResponse.access_token ||
    !tokenResponse.id_token
  ) {
    return redirectWithError(request, tokenResponse.error ?? "token_error");
  }

  const { payload } = await jwtVerify(tokenResponse.id_token, getJwks(), {
    issuer: getOAuthIssuer(),
    audience: getOAuthClientId(),
  });

  if (expectedNonce && payload.nonce !== expectedNonce) {
    return redirectWithError(request, "invalid_nonce");
  }

  const now = Math.floor(Date.now() / 1000);
  const session: AdminSession = {
    sub: String(payload.sub),
    email: typeof payload.email === "string" ? payload.email : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: now + (tokenResponse.expires_in ?? 3600),
    scope: tokenResponse.scope,
  };

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(
    SESSION_COOKIE,
    await encodeSession(session),
    sessionCookieOptions(),
  );
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NONCE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  response.cookies.delete("volante_login_next");

  return response;
}

async function exchangeCodeForTokens(code: string, verifier: string) {
  const response = await fetch(`${getOAuthIssuer()}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: createBasicAuthHeader(
        getOAuthClientId(),
        getOAuthClientSecret(),
      ),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getOAuthRedirectUri(),
      code_verifier: verifier,
    }),
  });

  return (await response.json()) as TokenResponse;
}

function redirectWithError(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("auth_error", error);
  return NextResponse.redirect(url);
}
