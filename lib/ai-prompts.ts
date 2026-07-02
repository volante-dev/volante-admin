import { getSiteProfile } from "./site-profile";

type BlogPromptInput = {
  title: string;
  eyebrow: string;
  slug: string;
  content: string;
};

const siteDescription = getSiteProfile().aiSiteDescription;

export const AI_PROMPTS = {
  translate: {
    system: (from: string, to: string) =>
      `You are a professional translator. Translate the following text from locale ${from} to locale ${to}. Preserve the original tone and style. Return only the translated text, nothing else.`,
    htmlAddendum:
      " The text contains HTML markup. Preserve all HTML tags, attributes, and structure exactly. Only translate the text content within and between tags.",
  },
  mediaMetadata: {
    system:
      `You generate accessibility metadata for ${siteDescription}. Return only valid JSON with keys alt and tags. alt must be concise French image alternative text. tags must contain exactly 5 short French tags, lowercase where natural, without hashtags.`,
    user: (assetName?: string) =>
      `Analyse cette image${assetName ? ` (${assetName})` : ""} et genere les metadonnees demandees.`,
  },
  blogTags: {
    system:
      `You generate concise SEO tags for a blog article on ${siteDescription}. Return only valid JSON with key tags. tags must contain 10 to 14 short French tags. Tags must be relevant, natural, lowercase where appropriate, without hashtags, without duplicates, and must not be clickbait or keyword stuffing.`,
    user: (input: BlogPromptInput) =>
      [
        `Titre FR: ${input.title}`,
        `Eyebrow FR: ${input.eyebrow}`,
        `Slug FR: ${input.slug}`,
        `Contenu FR:\n${input.content}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
  },
  blogSeoDescription: {
    system:
      `You write SEO meta descriptions for blog articles on ${siteDescription}. Return only valid JSON with key seoDescription. The description must be unique, accurate, human-readable, page-specific, compelling without clickbait, and useful as a Google Search snippet. Do not write a list of keywords, do not keyword-stuff, do not invent facts, and do not mention Google. Aim for 140 to 160 characters, with a hard maximum of 240 characters.`,
    user: (input: BlogPromptInput) =>
      [
        `Titre FR: ${input.title}`,
        `Eyebrow FR: ${input.eyebrow}`,
        `Slug FR: ${input.slug}`,
        `Contenu FR:\n${input.content}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
  },
} as const;

export const getTranslateSystemPrompt = (
  format: "plain" | "html",
  from: string,
  to: string,
) =>
  format === "html"
    ? AI_PROMPTS.translate.system(from, to) + AI_PROMPTS.translate.htmlAddendum
    : AI_PROMPTS.translate.system(from, to);
