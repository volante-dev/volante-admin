"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { isValidMediaUrl, normalizeNullable, normalizeRequired } from "@/lib/validation";
import { isBlankRichText, sanitizeRichTextHtml } from "@/lib/rich-text";

type ActionResult = {
  success: boolean;
  error?: string;
};

const requiredTextFields = [
  ["eyebrow", "L'eyebrow est obligatoire."],
  ["title", "Le titre est obligatoire."],
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

const parseStudioPageContent = async (formData: FormData) => {
  const values = {
    eyebrow: normalizeRequired(formData.get("eyebrow")),
    eyebrowEn: normalizeNullable(formData.get("eyebrowEn")),
    title: normalizeRequired(formData.get("title")),
    titleEn: normalizeNullable(formData.get("titleEn")),
    intro: normalizeRequired(formData.get("intro")),
    introEn: normalizeNullable(formData.get("introEn")),
    founderOneName: normalizeRequired(formData.get("founderOneName")),
    founderOneNameEn: normalizeNullable(formData.get("founderOneNameEn")),
    founderOneRole: normalizeRequired(formData.get("founderOneRole")),
    founderOneRoleEn: normalizeNullable(formData.get("founderOneRoleEn")),
    founderOneDescription:
      typeof formData.get("founderOneDescription") === "string"
        ? String(formData.get("founderOneDescription"))
        : "",
    founderOneDescriptionEn:
      typeof formData.get("founderOneDescriptionEn") === "string"
        ? String(formData.get("founderOneDescriptionEn"))
        : "",
    founderOneImageUrl: normalizeRequired(formData.get("founderOneImageUrl")),
    founderOneImageAssetId: normalizeNullable(
      formData.get("founderOneImageAssetId"),
    ),
    founderOneImageAlt: normalizeNullable(formData.get("founderOneImageAlt")),
    founderOneImageAltEn: normalizeNullable(
      formData.get("founderOneImageAltEn"),
    ),
    founderTwoName: normalizeRequired(formData.get("founderTwoName")),
    founderTwoNameEn: normalizeNullable(formData.get("founderTwoNameEn")),
    founderTwoRole: normalizeRequired(formData.get("founderTwoRole")),
    founderTwoRoleEn: normalizeNullable(formData.get("founderTwoRoleEn")),
    founderTwoDescription:
      typeof formData.get("founderTwoDescription") === "string"
        ? String(formData.get("founderTwoDescription"))
        : "",
    founderTwoDescriptionEn:
      typeof formData.get("founderTwoDescriptionEn") === "string"
        ? String(formData.get("founderTwoDescriptionEn"))
        : "",
    founderTwoImageUrl: normalizeRequired(formData.get("founderTwoImageUrl")),
    founderTwoImageAssetId: normalizeNullable(
      formData.get("founderTwoImageAssetId"),
    ),
    founderTwoImageAlt: normalizeNullable(formData.get("founderTwoImageAlt")),
    founderTwoImageAltEn: normalizeNullable(
      formData.get("founderTwoImageAltEn"),
    ),
    historyTitle: normalizeRequired(formData.get("historyTitle")),
    historyTitleEn: normalizeNullable(formData.get("historyTitleEn")),
    historyContentHtml:
      typeof formData.get("historyContentHtml") === "string"
        ? String(formData.get("historyContentHtml"))
        : "",
    historyContentHtmlEn:
      typeof formData.get("historyContentHtmlEn") === "string"
        ? String(formData.get("historyContentHtmlEn"))
        : "",
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
    },
  } as const;
};

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

export const updateStudioPageContent = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = await parseStudioPageContent(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.studioPageContent.upsert({
      where: { id: "studio" },
      create: { id: "studio", ...parsed.data },
      update: parsed.data,
    });

    revalidatePath("/pages/studio");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
