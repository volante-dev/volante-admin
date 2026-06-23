import { getSession } from "@/lib/session";
import { getAccountSummary } from "@/lib/account";
import { executeAiTask } from "@/lib/ai";
import type { AiTask } from "@/lib/ai";

const KNOWN_TASKS = new Set(["translate", "generate-media-metadata"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ success: false, error: "Non autorise." }, { status: 401 });
  }

  const account = await getAccountSummary(session);
  if (!account || account.account_type !== "crm" || account.disabled) {
    return Response.json({ success: false, error: "Acces interdit." }, { status: 403 });
  }

  let body: AiTask;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Corps de requete invalide." }, { status: 400 });
  }

  if (!body.task || !KNOWN_TASKS.has(body.task)) {
    return Response.json({ success: false, error: "Tache IA inconnue." }, { status: 400 });
  }

  if (body.task === "translate") {
    if (!body.text || typeof body.text !== "string" || !body.text.trim()) {
      return Response.json({ success: false, error: "Le texte a traduire est requis." }, { status: 400 });
    }
  }

  if (body.task === "generate-media-metadata") {
    if (!body.imageUrl || typeof body.imageUrl !== "string" || !body.imageUrl.trim()) {
      return Response.json({ success: false, error: "L'image est requise." }, { status: 400 });
    }
  }

  try {
    const result = await executeAiTask(body);
    return Response.json(result);
  } catch {
    return Response.json(
      { success: false, error: "Erreur lors du traitement de la requete IA." },
      { status: 500 },
    );
  }
}
