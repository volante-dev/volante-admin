import { redirect } from "next/navigation";
import { getAccountSummary, getDisplayName } from "@/lib/account";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
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

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-zinc-500">
              Admin Panel
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{displayName}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {account?.email ?? session.email ?? "Email indisponible"}
            </p>
          </div>
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            href="/logout"
          >
            Se deconnecter
          </a>
        </header>

        {!account || account.account_type === "unknown" ? (
          <StatusPanel
            title="Compte non configure"
            message="Votre identite Supabase est valide, mais aucun compte metier n'est encore associe."
          />
        ) : account.disabled ? (
          <StatusPanel
            title="Compte desactive"
            message="Votre compte est connecte mais desactive. Les fonctionnalites metier sont masquees."
          />
        ) : (
          <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Espace restreint</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="font-medium text-zinc-500">Prenom</dt>
                <dd className="mt-1 text-zinc-950">
                  {account.first_name ?? "Non renseigne"}
                </dd>
              </div>
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="font-medium text-zinc-500">Nom</dt>
                <dd className="mt-1 text-zinc-950">
                  {account.last_name ?? "Non renseigne"}
                </dd>
              </div>
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="font-medium text-zinc-500">Email</dt>
                <dd className="mt-1 text-zinc-950">
                  {account.email ?? session.email ?? "Non renseigne"}
                </dd>
              </div>
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="font-medium text-zinc-500">Type de compte</dt>
                <dd className="mt-1 text-zinc-950">{account.account_type}</dd>
              </div>
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="font-medium text-zinc-500">Identifiant</dt>
                <dd className="mt-1 text-zinc-950">
                  {account.account_id ?? session.sub}
                </dd>
              </div>
            </dl>
          </section>
        )}
      </section>
    </main>
  );
}

function StatusPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
    </section>
  );
}
