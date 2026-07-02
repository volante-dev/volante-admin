import { NextResponse, type NextRequest } from "next/server";
import {
  getOAuthClientId,
  getOAuthIssuer,
  getOAuthRedirectUriForOrigin,
} from "@/lib/config";
import {
  createCodeChallenge,
  OAUTH_LOGIN_NEXT_COOKIE,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  randomToken,
} from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const challenge = createCodeChallenge(verifier);
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/";
  const redirectUri = getOAuthRedirectUriForOrigin(request.nextUrl.origin);

  const authorizeUrl = new URL(`${getOAuthIssuer()}/oauth/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", getOAuthClientId());
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };

  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(OAUTH_NONCE_COOKIE, nonce, cookieOptions);
  response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, cookieOptions);
  response.cookies.set(OAUTH_LOGIN_NEXT_COOKIE, next, cookieOptions);

  return response;
}
