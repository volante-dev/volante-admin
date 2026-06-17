import { redirect } from "next/navigation";
import { getSession } from "./session";
import { getAccountSummary } from "./account";
import type { AdminSession } from "./session";
import type { AccountSummary } from "./account";

export const requireCrmAccess = async (): Promise<{
  session: AdminSession;
  account: AccountSummary;
}> => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt <= now + 30) {
    redirect("/api/auth/refresh?next=/");
  }

  const account = await getAccountSummary(session);
  if (!account || account.account_type !== "crm" || account.disabled) {
    throw new Error("Forbidden");
  }

  return { session, account };
};
