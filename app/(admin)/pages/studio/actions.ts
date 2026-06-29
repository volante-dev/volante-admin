"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { isValidMediaUrl, normalizeNullable, normalizeRequired } from "@/lib/validation";
import { isBlankRichText, sanitizeRichTextHtml } from "@/lib/rich-text";
import {
  legacyDefaultLocale,
  legacyDefaultTextValue,
  legacySecondaryLocale,
  legacySecondaryTextValue,
  mergeLegacyLocaleTextTranslations,
  parseLocaleTextTranslations,
  type LocaleTextTranslations,
} from "@/lib/admin-translations";

type ActionResult = {
  success: boolean;
  error?: string;
};

const requiredTextFields = [
  ["intro", "Le texte introductif est obligatoire."],
  ["founderOneName", "Le nom du fondateur 1 est obligatoire."],
  ["founderOneRole", "Le role du fondateur 1 est obligatoire."],
  ["founderTwoName", "Le nom du fondateur 2 est obligatoire."],
  ["founderTwoRole", "Le role du fondateur 2 est obligatoire."],
  ["historyTitle", "Le titre Notre histoire est obligatoire."],
] as const;

const requiredImageFields = [
  ["founderOneImageUrl", "La photo du fondateur 1 est obligatoire."],
  ["founderTwoImageUrl", "La photo du fondateur 2 est obligatoire."],
] as const;

type StudioPageTranslationField =
  | "eyebrow"
  | "title"
  | "intro"
  | "founderOneName"
  | "founderOneRole"
  | "founderOneDescription"
  | "founderTwoName"
  | "founderTwoRole"
  | "founderTwoDescription"
  | "historyTitle"
  | "historyContentHtml";

const studioPageTranslationFields = [
  "eyebrow",
  "title",
  "intro",
  "founderOneName",
  "founderOneRole",
  "founderOneDescription",
  "founderTwoName",
  "founderTwoRole",
  "founderTwoDescription",
  "historyTitle",
  "historyContentHtml",
] as const satisfies readonly StudioPageTranslationField[];

const translationValue = (
  translations: LocaleTextTranslations<StudioPageTranslationField>,
  field: StudioPageTranslationField,
  fallback: FormDataEntryValue | null,
) => legacyDefaultTextValue(translations, field) ?? normalizeRequired(fallback);

const translationSecondaryValue = (
  translations: LocaleTextTranslations<StudioPageTranslationField>,
  field: StudioPageTranslationField,
  fallback: FormDataEntryValue | null,
) => legacySecondaryTextValue(translations, field) ?? normalizeNullable(fallback);

const parseStudioPageContent = async (formData: FormData) => {
  const translations = parseLocaleTextTranslations(
    formData,
    studioPageTranslationFields,
  );
  const values = {
    eyebrow: translationValue(translations, "eyebrow", formData.get("eyebrow")),
    eyebrowEn: translationSecondaryValue(
      translations,
      "eyebrow",
      formData.get("eyebrowEn"),
    ),
    title: translationValue(translations, "title", formData.get("title")),
    titleEn: translationSecondaryValue(
      translations,
      "title",
      formData.get("titleEn"),
    ),
    intro: translationValue(translations, "intro", formData.get("intro")),
    introEn: translationSecondaryValue(
      translations,
      "intro",
      formData.get("introEn"),
    ),
    founderOneName: translationValue(
      translations,
      "founderOneName",
      formData.get("founderOneName"),
    ),
    founderOneNameEn: translationSecondaryValue(
      translations,
      "founderOneName",
      formData.get("founderOneNameEn"),
    ),
    founderOneRole: translationValue(
      translations,
      "founderOneRole",
      formData.get("founderOneRole"),
    ),
    founderOneRoleEn: translationSecondaryValue(
      translations,
      "founderOneRole",
      formData.get("founderOneRoleEn"),
    ),
    founderOneDescription:
      legacyDefaultTextValue(translations, "founderOneDescription") ??
      (typeof formData.get("founderOneDescription") === "string"
        ? String(formData.get("founderOneDescription"))
        : ""),
    founderOneDescriptionEn:
      legacySecondaryTextValue(translations, "founderOneDescription") ??
      (typeof formData.get("founderOneDescriptionEn") === "string"
        ? String(formData.get("founderOneDescriptionEn"))
        : ""),
    founderOneImageUrl: normalizeRequired(formData.get("founderOneImageUrl")),
    founderOneImageAssetId: normalizeNullable(
      formData.get("founderOneImageAssetId"),
    ),
    founderOneImageAlt: normalizeNullable(formData.get("founderOneImageAlt")),
    founderOneImageAltEn: normalizeNullable(
      formData.get("founderOneImageAltEn"),
    ),
    founderTwoName: translationValue(
      translations,
      "founderTwoName",
      formData.get("founderTwoName"),
    ),
    founderTwoNameEn: translationSecondaryValue(
      translations,
      "founderTwoName",
      formData.get("founderTwoNameEn"),
    ),
    founderTwoRole: translationValue(
      translations,
      "founderTwoRole",
      formData.get("founderTwoRole"),
    ),
    founderTwoRoleEn: translationSecondaryValue(
      translations,
      "founderTwoRole",
      formData.get("founderTwoRoleEn"),
    ),
    founderTwoDescription:
      legacyDefaultTextValue(translations, "founderTwoDescription") ??
      (typeof formData.get("founderTwoDescription") === "string"
        ? String(formData.get("founderTwoDescription"))
        : ""),
    founderTwoDescriptionEn:
      legacySecondaryTextValue(translations, "founderTwoDescription") ??
      (typeof formData.get("founderTwoDescriptionEn") === "string"
        ? String(formData.get("founderTwoDescriptionEn"))
        : ""),
    founderTwoImageUrl: normalizeRequired(formData.get("founderTwoImageUrl")),
    founderTwoImageAssetId: normalizeNullable(
      formData.get("founderTwoImageAssetId"),
    ),
    founderTwoImageAlt: normalizeNullable(formData.get("founderTwoImageAlt")),
    founderTwoImageAltEn: normalizeNullable(
      formData.get("founderTwoImageAltEn"),
    ),
    historyTitle: translationValue(
      translations,
      "historyTitle",
      formData.get("historyTitle"),
    ),
    historyTitleEn: translationSecondaryValue(
      translations,
      "historyTitle",
      formData.get("historyTitleEn"),
    ),
    historyContentHtml:
      legacyDefaultTextValue(translations, "historyContentHtml") ??
      (typeof formData.get("historyContentHtml") === "string"
        ? String(formData.get("historyContentHtml"))
        : ""),
    historyContentHtmlEn:
      legacySecondaryTextValue(translations, "historyContentHtml") ??
      (typeof formData.get("historyContentHtmlEn") === "string"
        ? String(formData.get("historyContentHtmlEn"))
        : ""),
  };

  for (const [field, message] of requiredTextFields) {
    if (values[field].length < 2) return { error: message } as const;
  }

  if (isBlankRichText(values.founderOneDescription)) {
    return {
      error: "La description du fondateur 1 est obligatoire.",
    } as const;
  }
  if (isBlankRichText(values.founderTwoDescription)) {
    return {
      error: "La description du fondateur 2 est obligatoire.",
    } as const;
  }
  if (isBlankRichText(values.historyContentHtml)) {
    return {
      error: "La description Notre histoire est obligatoire.",
    } as const;
  }

  for (const [field, message] of requiredImageFields) {
    if (!values[field]) return { error: message } as const;
    if (!isValidMediaUrl(values[field])) {
      return { error: `${message} L'URL est invalide.` } as const;
    }
  }

  const mediaAssetIds = [
    values.founderOneImageAssetId,
    values.founderTwoImageAssetId,
  ].filter((id): id is string => Boolean(id));
  const mediaAssets = mediaAssetIds.length
    ? await prisma.mediaAsset.findMany({
        where: { id: { in: mediaAssetIds } },
        select: { id: true, url: true, mediaType: true, active: true },
      })
    : [];
  const mediaAssetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  for (const id of mediaAssetIds) {
    if (!mediaAssetById.has(id)) {
      return { error: "Un media selectionne est invalide." } as const;
    }
  }

  const founderOneAsset = values.founderOneImageAssetId
    ? mediaAssetById.get(values.founderOneImageAssetId)
    : null;
  if (founderOneAsset) {
    if (!founderOneAsset.active || founderOneAsset.mediaType !== "IMAGE") {
      return { error: "La photo du fondateur 1 selectionnee est invalide." } as const;
    }
    if (founderOneAsset.url !== values.founderOneImageUrl) {
      return {
        error: "La photo du fondateur 1 ne correspond pas au media selectionne.",
      } as const;
    }
  }

  const founderTwoAsset = values.founderTwoImageAssetId
    ? mediaAssetById.get(values.founderTwoImageAssetId)
    : null;
  if (founderTwoAsset) {
    if (!founderTwoAsset.active || founderTwoAsset.mediaType !== "IMAGE") {
      return { error: "La photo du fondateur 2 selectionnee est invalide." } as const;
    }
    if (founderTwoAsset.url !== values.founderTwoImageUrl) {
      return {
        error: "La photo du fondateur 2 ne correspond pas au media selectionne.",
      } as const;
    }
  }

  return {
    data: {
      ...values,
      founderOneDescription: sanitizeRichTextHtml(values.founderOneDescription),
      founderOneDescriptionEn: isBlankRichText(values.founderOneDescriptionEn)
        ? null
        : sanitizeRichTextHtml(values.founderOneDescriptionEn),
      founderTwoDescription: sanitizeRichTextHtml(values.founderTwoDescription),
      founderTwoDescriptionEn: isBlankRichText(values.founderTwoDescriptionEn)
        ? null
        : sanitizeRichTextHtml(values.founderTwoDescriptionEn),
      historyContentHtml: sanitizeRichTextHtml(values.historyContentHtml),
      historyContentHtmlEn: isBlankRichText(values.historyContentHtmlEn)
        ? null
        : sanitizeRichTextHtml(values.historyContentHtmlEn),
      translations,
    },
  } as const;
};

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

type StudioPageContentData = Extract<
  Awaited<ReturnType<typeof parseStudioPageContent>>,
  { data: unknown }
>["data"];

const studioPageTranslations = (
  contentId: string,
  data: StudioPageContentData,
) => {
  const translations = data.translations;
  mergeLegacyLocaleTextTranslations(translations, legacyDefaultLocale, {
    eyebrow: data.eyebrow,
    title: data.title,
    intro: data.intro,
    founderOneName: data.founderOneName,
    founderOneRole: data.founderOneRole,
    founderOneDescription: data.founderOneDescription,
    founderTwoName: data.founderTwoName,
    founderTwoRole: data.founderTwoRole,
    founderTwoDescription: data.founderTwoDescription,
    historyTitle: data.historyTitle,
    historyContentHtml: data.historyContentHtml,
  });
  mergeLegacyLocaleTextTranslations(translations, legacySecondaryLocale, {
    eyebrow: data.eyebrowEn,
    title: data.titleEn,
    intro: data.introEn,
    founderOneName: data.founderOneNameEn,
    founderOneRole: data.founderOneRoleEn,
    founderOneDescription: data.founderOneDescriptionEn,
    founderTwoName: data.founderTwoNameEn,
    founderTwoRole: data.founderTwoRoleEn,
    founderTwoDescription: data.founderTwoDescriptionEn,
    historyTitle: data.historyTitleEn,
    historyContentHtml: data.historyContentHtmlEn,
  });

  return Object.entries(translations).map(([locale, values]) => ({
    contentId,
    locale,
    eyebrow: values.eyebrow ?? null,
    title: values.title ?? null,
    intro: values.intro ?? null,
    founderOneName: values.founderOneName ?? null,
    founderOneRole: values.founderOneRole ?? null,
    founderOneDescription:
      values.founderOneDescription && !isBlankRichText(values.founderOneDescription)
        ? sanitizeRichTextHtml(values.founderOneDescription)
        : null,
    founderOneImageAlt:
      locale === legacyDefaultLocale
        ? data.founderOneImageAlt
        : locale === legacySecondaryLocale
          ? data.founderOneImageAltEn
          : null,
    founderTwoName: values.founderTwoName ?? null,
    founderTwoRole: values.founderTwoRole ?? null,
    founderTwoDescription:
      values.founderTwoDescription && !isBlankRichText(values.founderTwoDescription)
        ? sanitizeRichTextHtml(values.founderTwoDescription)
        : null,
    founderTwoImageAlt:
      locale === legacyDefaultLocale
        ? data.founderTwoImageAlt
        : locale === legacySecondaryLocale
          ? data.founderTwoImageAltEn
          : null,
    historyTitle: values.historyTitle ?? null,
    historyContentHtml:
      values.historyContentHtml && !isBlankRichText(values.historyContentHtml)
        ? sanitizeRichTextHtml(values.historyContentHtml)
        : null,
  }));
};

const studioPageContentData = (data: StudioPageContentData) => ({
  eyebrow: data.eyebrow,
  eyebrowEn: data.eyebrowEn,
  title: data.title,
  titleEn: data.titleEn,
  intro: data.intro,
  introEn: data.introEn,
  founderOneName: data.founderOneName,
  founderOneNameEn: data.founderOneNameEn,
  founderOneRole: data.founderOneRole,
  founderOneRoleEn: data.founderOneRoleEn,
  founderOneDescription: data.founderOneDescription,
  founderOneDescriptionEn: data.founderOneDescriptionEn,
  founderOneImageUrl: data.founderOneImageUrl,
  founderOneImageAssetId: data.founderOneImageAssetId,
  founderOneImageAlt: data.founderOneImageAlt,
  founderOneImageAltEn: data.founderOneImageAltEn,
  founderTwoName: data.founderTwoName,
  founderTwoNameEn: data.founderTwoNameEn,
  founderTwoRole: data.founderTwoRole,
  founderTwoRoleEn: data.founderTwoRoleEn,
  founderTwoDescription: data.founderTwoDescription,
  founderTwoDescriptionEn: data.founderTwoDescriptionEn,
  founderTwoImageUrl: data.founderTwoImageUrl,
  founderTwoImageAssetId: data.founderTwoImageAssetId,
  founderTwoImageAlt: data.founderTwoImageAlt,
  founderTwoImageAltEn: data.founderTwoImageAltEn,
  historyTitle: data.historyTitle,
  historyTitleEn: data.historyTitleEn,
  historyContentHtml: data.historyContentHtml,
  historyContentHtmlEn: data.historyContentHtmlEn,
});

export const updateStudioPageContent = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = await parseStudioPageContent(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction([
      prisma.studioPageContent.upsert({
        where: { id: "studio" },
        create: { id: "studio", ...studioPageContentData(parsed.data) },
        update: studioPageContentData(parsed.data),
      }),
      ...studioPageTranslations("studio", parsed.data).map((translation) =>
        prisma.studioPageContentTranslation.upsert({
          where: {
            contentId_locale: {
              contentId: translation.contentId,
              locale: translation.locale,
            },
          },
          create: translation,
          update: {
            eyebrow: translation.eyebrow,
            title: translation.title,
            intro: translation.intro,
            founderOneName: translation.founderOneName,
            founderOneRole: translation.founderOneRole,
            founderOneDescription: translation.founderOneDescription,
            founderOneImageAlt: translation.founderOneImageAlt,
            founderTwoName: translation.founderTwoName,
            founderTwoRole: translation.founderTwoRole,
            founderTwoDescription: translation.founderTwoDescription,
            founderTwoImageAlt: translation.founderTwoImageAlt,
            historyTitle: translation.historyTitle,
            historyContentHtml: translation.historyContentHtml,
          },
        }),
      ),
    ]);

    revalidatePath("/pages/studio");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
