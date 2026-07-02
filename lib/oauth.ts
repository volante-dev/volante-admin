import { createHash, randomBytes } from "crypto";
import { getSiteProfile } from "./site-profile";

export const OAUTH_COOKIE_MAX_AGE = 10 * 60;
const cookiePrefix = getSiteProfile().cookiePrefix;
export const OAUTH_STATE_COOKIE = `${cookiePrefix}_oauth_state`;
export const OAUTH_NONCE_COOKIE = `${cookiePrefix}_oauth_nonce`;
export const OAUTH_VERIFIER_COOKIE = `${cookiePrefix}_oauth_verifier`;
export const OAUTH_LOGIN_NEXT_COOKIE = `${cookiePrefix}_login_next`;

export function randomToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function createCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function createBasicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  )}`;
}
