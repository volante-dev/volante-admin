import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";
import type { AdminSession } from "./session";

export type AccountSummary = {
  account_type: "crm" | "client" | "unknown";
  account_id: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  disabled: boolean;
};

export async function getAccountSummary(session: AdminSession) {
  const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  });

  const { data, error } = await supabase.rpc("current_account_summary");
  if (error) {
    console.error("[account] RPC error:", JSON.stringify(error));
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as AccountSummary | null;
}

export async function getAccountDebug(session: AdminSession) {
  const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  });

  const { data, error } = await supabase.rpc("current_account_summary");
  return { data, error, supabaseUrl: getSupabaseUrl() };
}

export function getDisplayName(
  account: AccountSummary | null,
  session: AdminSession,
) {
  const fullName = [account?.first_name, account?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || session.name || account?.email || session.email || "User";
}
