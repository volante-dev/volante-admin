import { createHash, randomBytes } from "crypto";

export const OAUTH_COOKIE_MAX_AGE = 10 * 60;
export const OAUTH_STATE_COOKIE = "volante_oauth_state";
export const OAUTH_NONCE_COOKIE = "volante_oauth_nonce";
export const OAUTH_VERIFIER_COOKIE = "volante_oauth_verifier";

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
