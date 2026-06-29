import OpenAI from "openai";
import { AI_PROMPTS, getTranslateSystemPrompt } from "./ai-prompts";
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

export type GenerateBlogTagsTask = {
  task: "generate-blog-tags";
  title: string;
  titleEn?: string;
  eyebrow: string;
  eyebrowEn?: string;
  slug: string;
  slugEn?: string;
  content: string;
  contentEn?: string;
};

export type GenerateBlogSeoDescriptionTask = {
  task: "generate-blog-seo-description";
  title: string;
  titleEn?: string;
  eyebrow: string;
  eyebrowEn?: string;
  slug: string;
  slugEn?: string;
  content: string;
  contentEn?: string;
};

export type MediaMetadataOutput = {
  alt: string;
  altEn: string;
  tags: string[];
};

export type BlogTagsOutput = {
  tags: string[];
  tagsEn: string[];
};

export type BlogSeoDescriptionOutput = {
  seoDescription: string;
  seoDescriptionEn: string;
};

export type AiTask =
  | TranslateTask
  | GenerateMediaMetadataTask
  | GenerateBlogTagsTask
  | GenerateBlogSeoDescriptionTask;

export type AiTaskResult =
  | {
      success: true;
      output:
        | string
        | MediaMetadataOutput
        | BlogTagsOutput
        | BlogSeoDescriptionOutput;
    }
  | { success: false; error: string };

let client: OpenAI | null = null;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: getOpenAiApiKey() });
  }
  return client;
}

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

const normalizeTags = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();

  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter((tag) => tag.length >= 2 && tag.length <= 48)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase("fr-FR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 14);
};

const parseBlogTags = (value: string): BlogTagsOutput | null => {
  try {
    const parsed = JSON.parse(value) as Partial<BlogTagsOutput>;
    const tags = normalizeTags(parsed.tags);
    const tagsEn = normalizeTags(parsed.tagsEn);

    if (tags.length < 6 || tagsEn.length < 6) return null;
    return { tags, tagsEn };
  } catch {
    return null;
  }
};

const normalizeSeoDescription = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const parseBlogSeoDescription = (
  value: string,
): BlogSeoDescriptionOutput | null => {
  try {
    const parsed = JSON.parse(value) as Partial<BlogSeoDescriptionOutput>;
    const seoDescription = normalizeSeoDescription(parsed.seoDescription);
    const seoDescriptionEn = normalizeSeoDescription(parsed.seoDescriptionEn);

    if (
      seoDescription.length < 60 ||
      seoDescription.length > 240 ||
      seoDescriptionEn.length < 60 ||
      seoDescriptionEn.length > 240
    ) {
      return null;
    }

    return { seoDescription, seoDescriptionEn };
  } catch {
    return null;
  }
};

async function handleTranslate(task: TranslateTask): Promise<AiTaskResult> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: "system", content: getTranslateSystemPrompt(task.format) },
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
      { role: "system", content: AI_PROMPTS.mediaMetadata.system },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: AI_PROMPTS.mediaMetadata.user(task.assetName),
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

async function handleGenerateBlogTags(
  task: GenerateBlogTagsTask,
): Promise<AiTaskResult> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: AI_PROMPTS.blogTags.system },
      {
        role: "user",
        content: AI_PROMPTS.blogTags.user(task),
      },
    ],
  });

  const output = response.choices[0]?.message?.content?.trim();
  if (!output) {
    return { success: false, error: "Aucune reponse du modele." };
  }

  const tags = parseBlogTags(output);
  if (!tags) {
    return {
      success: false,
      error: "La reponse IA ne contient pas des tags FR/EN valides.",
    };
  }

  return { success: true, output: tags };
}

async function handleGenerateBlogSeoDescription(
  task: GenerateBlogSeoDescriptionTask,
): Promise<AiTaskResult> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    max_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: AI_PROMPTS.blogSeoDescription.system },
      {
        role: "user",
        content: AI_PROMPTS.blogSeoDescription.user(task),
      },
    ],
  });

  const output = response.choices[0]?.message?.content?.trim();
  if (!output) {
    return { success: false, error: "Aucune reponse du modele." };
  }

  const descriptions = parseBlogSeoDescription(output);
  if (!descriptions) {
    return {
      success: false,
      error: "La reponse IA ne contient pas deux descriptions SEO valides.",
    };
  }

  return { success: true, output: descriptions };
}

export async function executeAiTask(task: AiTask): Promise<AiTaskResult> {
  switch (task.task) {
    case "translate":
      return handleTranslate(task);
    case "generate-media-metadata":
      return handleGenerateMediaMetadata(task);
    case "generate-blog-tags":
      return handleGenerateBlogTags(task);
    case "generate-blog-seo-description":
      return handleGenerateBlogSeoDescription(task);
    default:
      return { success: false, error: "Tache IA inconnue." };
  }
}
