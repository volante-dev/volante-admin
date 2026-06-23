import OpenAI from "openai";
import { getAppUrl, getOpenAiApiKey } from "./config";

export type TranslateTask = {
  task: "translate";
  text: string;
  from: "fr";
  to: "en";
  format: "plain" | "html";
};

export type GenerateMediaMetadataTask = {
  task: "generate-media-metadata";
  imageUrl: string;
  assetName?: string;
};

export type MediaMetadataOutput = {
  alt: string;
  altEn: string;
  tags: string[];
};

export type AiTask = TranslateTask | GenerateMediaMetadataTask;

export type AiTaskResult =
  | { success: true; output: string | MediaMetadataOutput }
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

const MEDIA_METADATA_SYSTEM_PROMPT =
  "You generate accessibility metadata for a French creative studio website. Return only valid JSON with keys alt, altEn, tags. alt must be concise French image alternative text. altEn must be the English equivalent. tags must contain exactly 5 short French tags, lowercase where natural, without hashtags.";

const toAbsoluteImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return new URL(imageUrl, getAppUrl()).toString();
};

const parseMediaMetadata = (value: string): MediaMetadataOutput | null => {
  try {
    const parsed = JSON.parse(value) as Partial<MediaMetadataOutput>;
    const alt = typeof parsed.alt === "string" ? parsed.alt.trim() : "";
    const altEn = typeof parsed.altEn === "string" ? parsed.altEn.trim() : "";
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    if (!alt || !altEn || tags.length !== 5) return null;
    return { alt, altEn, tags };
  } catch {
    return null;
  }
};

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

async function handleGenerateMediaMetadata(
  task: GenerateMediaMetadataTask,
): Promise<AiTaskResult> {
  const imageUrl = toAbsoluteImageUrl(task.imageUrl);
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: MEDIA_METADATA_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyse cette image${task.assetName ? ` (${task.assetName})` : ""} et genere les metadonnees demandees.`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  });

  const output = response.choices[0]?.message?.content?.trim();
  if (!output) {
    return { success: false, error: "Aucune reponse du modele." };
  }

  const metadata = parseMediaMetadata(output);
  if (!metadata) {
    return {
      success: false,
      error: "La reponse IA ne contient pas 5 tags et deux textes alternatifs valides.",
    };
  }

  return { success: true, output: metadata };
}

export async function executeAiTask(task: AiTask): Promise<AiTaskResult> {
  switch (task.task) {
    case "translate":
      return handleTranslate(task);
    case "generate-media-metadata":
      return handleGenerateMediaMetadata(task);
    default:
      return { success: false, error: "Tache IA inconnue." };
  }
}
