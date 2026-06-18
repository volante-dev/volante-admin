export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getAppUrl() {
  const configuredUrl = process.env.APP_URL ?? "http://localhost:3002";
  return new URL(configuredUrl).origin;
}

export function getAuthAppUrl() {
  const configuredUrl = process.env.AUTH_APP_URL ?? "http://localhost:3001";
  return new URL(configuredUrl).origin;
}

export function getFrontendAppUrl() {
  const configuredUrl = process.env.FRONTEND_APP_URL ?? "http://localhost:3000";
  return new URL(configuredUrl).origin;
}

export function getOAuthIssuer() {
  return requiredEnv("SUPABASE_OAUTH_ISSUER").replace(/\/$/, "");
}

export function getOAuthClientId() {
  return requiredEnv("SUPABASE_OAUTH_CLIENT_ID");
}

export function getOAuthClientSecret() {
  return process.env.SUPABASE_OAUTH_CLIENT_SECRET;
}

export function getSupabaseUrl() {
  return requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

export function getOAuthRedirectUri() {
  return `${getAppUrl()}/api/auth/callback/supabase`;
}
