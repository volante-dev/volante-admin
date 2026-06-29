type BlogPromptInput = {
  title: string;
  titleEn?: string;
  eyebrow: string;
  eyebrowEn?: string;
  slug: string;
  slugEn?: string;
  content: string;
  contentEn?: string;
};

export const AI_PROMPTS = {
  translate: {
    system:
      "You are a professional translator. Translate the following text from French to English. Preserve the original tone and style. Return only the translated text, nothing else.",
    htmlAddendum:
      " The text contains HTML markup. Preserve all HTML tags, attributes, and structure exactly. Only translate the text content within and between tags.",
  },
  mediaMetadata: {
    system:
      "You generate accessibility metadata for a French creative studio website. Return only valid JSON with keys alt, altEn, tags. alt must be concise French image alternative text. altEn must be the English equivalent. tags must contain exactly 5 short French tags, lowercase where natural, without hashtags.",
    user: (assetName?: string) =>
      `Analyse cette image${assetName ? ` (${assetName})` : ""} et genere les metadonnees demandees.`,
  },
  blogTags: {
    system:
      "You generate concise SEO tags for a bilingual blog article on a French creative studio website. Return only valid JSON with keys tags and tagsEn. tags must contain 10 to 14 short French tags. tagsEn must contain 10 to 14 short English tags. Tags must be relevant, natural, lowercase where appropriate, without hashtags, without duplicates, and must not be clickbait or keyword stuffing.",
    user: (input: BlogPromptInput) =>
      [
        `Titre FR: ${input.title}`,
        input.titleEn ? `Title EN: ${input.titleEn}` : "",
        `Eyebrow FR: ${input.eyebrow}`,
        input.eyebrowEn ? `Eyebrow EN: ${input.eyebrowEn}` : "",
        `Slug FR: ${input.slug}`,
        input.slugEn ? `Slug EN: ${input.slugEn}` : "",
        `Contenu FR:\n${input.content}`,
        input.contentEn ? `Content EN:\n${input.contentEn}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
  },
  blogSeoDescription: {
    system:
      "You write SEO meta descriptions for bilingual blog articles on a French creative studio website. Return only valid JSON with keys seoDescription and seoDescriptionEn. Each description must be unique, accurate, human-readable, page-specific, compelling without clickbait, and useful as a Google Search snippet. Do not write a list of keywords, do not keyword-stuff, do not invent facts, and do not mention Google. Aim for 140 to 160 characters, with a hard maximum of 240 characters per description.",
    user: (input: BlogPromptInput) =>
      [
        `Titre FR: ${input.title}`,
        input.titleEn ? `Title EN: ${input.titleEn}` : "",
        `Eyebrow FR: ${input.eyebrow}`,
        input.eyebrowEn ? `Eyebrow EN: ${input.eyebrowEn}` : "",
        `Slug FR: ${input.slug}`,
        input.slugEn ? `Slug EN: ${input.slugEn}` : "",
        `Contenu FR:\n${input.content}`,
        input.contentEn ? `Content EN:\n${input.contentEn}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
  },
} as const;

export const getTranslateSystemPrompt = (format: "plain" | "html") =>
  format === "html"
    ? AI_PROMPTS.translate.system + AI_PROMPTS.translate.htmlAddendum
    : AI_PROMPTS.translate.system;
