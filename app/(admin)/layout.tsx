import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAccountSummary, getDisplayName } from "@/lib/account";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSiteProfile } from "@/lib/site-profile";

export const dynamic = "force-dynamic";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const siteProfile = getSiteProfile();
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // eslint-disable-next-line react-hooks/purity
  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt <= now + 30) {
    redirect("/api/auth/refresh?next=/");
  }

  const account = await getAccountSummary(session);
  const displayName = getDisplayName(account, session);
  const email = account?.email ?? session.email ?? "";

  if (!account || account.account_type !== "crm") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <section className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-lg font-semibold">Acces restreint</h2>
          <p className="mt-2 text-sm">
            Votre compte ne dispose pas des droits d&apos;administration du
            contenu.
          </p>
          <a
            className="mt-4 inline-block text-sm font-medium underline"
            href="/logout"
          >
            Se deconnecter
          </a>
        </section>
      </main>
    );
  }

  if (account.disabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <section className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-lg font-semibold">Compte desactive</h2>
          <p className="mt-2 text-sm">
            Votre compte est connecte mais desactive. Les fonctionnalites
            d&apos;administration sont masquees.
          </p>
          <a
            className="mt-4 inline-block text-sm font-medium underline"
            href="/logout"
          >
            Se deconnecter
          </a>
        </section>
      </main>
    );
  }

  return (
    <AdminShell
      appName={siteProfile.appName}
      displayName={displayName}
      email={email}
      navGroups={siteProfile.adminNav}
      settingsItems={siteProfile.settingsNav}
    >
      {children}
    </AdminShell>
  );
};

export default AdminLayout;
