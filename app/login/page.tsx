import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase text-zinc-500">
          Admin Panel
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
          Bienvenue
        </h1>
        <p className="mt-1 text-sm text-zinc-600">Portail client Volante</p>

        {params.auth_error ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            La connexion a echoue. Veuillez reessayer.
          </div>
        ) : null}

        <a
          href="/api/auth/login"
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Se connecter avec Volante SSO
        </a>
      </div>
    </main>
  );
}
