import OpenAI from "openai";
import { getOpenAiApiKey } from "./config";

export type TranslateTask = {
  task: "translate";
  text: string;
  from: "fr";
  to: "en";
  format: "plain" | "html";
};

export type AiTask = TranslateTask;

export type AiTaskResult =
  | { success: true; output: string }
  | { success: false; error: string };

let client: OpenAI | null = null;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: getOpenAiApiKey() });
  }
  return client;
}

const TRANSLATE_SYSTEM_PROMPT =
  "You are a professional translator. Translate the following text from French to English. Preserve the original tone and style. Return only the translated text, nothing else.";

const TRANSLATE_HTML_ADDENDUM =
  " The text contains HTML markup. Preserve all HTML tags, attributes, and structure exactly. Only translate the text content within and between tags.";

async function handleTranslate(task: TranslateTask): Promise<AiTaskResult> {
  const systemPrompt =
    task.format === "html"
      ? TRANSLATE_SYSTEM_PROMPT + TRANSLATE_HTML_ADDENDUM
      : TRANSLATE_SYSTEM_PROMPT;

  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: task.text },
    ],
  });

  const output = response.choices[0]?.message?.content?.trim();
  if (!output) {
    return { success: false, error: "Aucune reponse du modele." };
  }

  return { success: true, output };
}

export async function executeAiTask(task: AiTask): Promise<AiTaskResult> {
  switch (task.task) {
    case "translate":
      return handleTranslate(task);
    default:
      return { success: false, error: "Tache IA inconnue." };
  }
}
