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
  administrator: boolean;
};

const createAuthClient = (session: AdminSession) =>
  createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    global: {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    },
  });

export async function getAccountSummary(
  session: AdminSession,
): Promise<AccountSummary | null> {
  const supabase = createAuthClient(session);

  const [isCrmRes, isClientRes, salesIdRes] = await Promise.all([
    supabase.rpc("is_crm_user"),
    supabase.rpc("is_client_user"),
    supabase.rpc("current_sales_id"),
  ]);

  const isCrm = isCrmRes.data === true;
  const isClient = isClientRes.data === true;
  const salesId = salesIdRes.data as number | null;

  const accountType: AccountSummary["account_type"] = isCrm
    ? "crm"
    : isClient
      ? "client"
      : "unknown";

  if (isCrm && salesId) {
    const { data: sales } = await supabase
      .from("sales")
      .select("first_name, last_name, email, disabled, administrator")
      .eq("id", salesId)
      .single();

    if (sales) {
      return {
        account_type: accountType,
        account_id: salesId,
        first_name: sales.first_name,
        last_name: sales.last_name,
        email: sales.email,
        disabled: sales.disabled ?? false,
        administrator: sales.administrator ?? false,
      };
    }
  }

  return {
    account_type: accountType,
    account_id: null,
    first_name: null,
    last_name: null,
    email: session.email ?? null,
    disabled: false,
    administrator: false,
  };
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
