import { createHash } from "crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";
import { getSiteProfile } from "./site-profile";

export const SESSION_COOKIE = `${getSiteProfile().cookiePrefix}_admin_session`;

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AdminSession = {
  sub: string;
  email?: string;
  name?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
};

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }

  return createHash("sha256").update(secret).digest();
}

export async function encodeSession(session: AdminSession) {
  return new EncryptJWT(session)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .encrypt(getSessionKey());
}

export async function decodeSession(value: string | undefined) {
  if (!value) return null;

  try {
    const { payload } = await jwtDecrypt(value, getSessionKey());
    return payload as AdminSession;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
