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
  ["founderOneDescription", "La description du fondateur 1 est obligatoire."],
  ["founderTwoName", "Le nom du fondateur 2 est obligatoire."],
  ["founderTwoRole", "Le role du fondateur 2 est obligatoire."],
  ["founderTwoDescription", "La description du fondateur 2 est obligatoire."],
  ["historyTitle", "Le titre Notre histoire est obligatoire."],
] as const;

const requiredImageFields = [
  ["founderOneImageUrl", "La photo du fondateur 1 est obligatoire."],
  ["founderTwoImageUrl", "La photo du fondateur 2 est obligatoire."],
] as const;

const parseStudioPageContent = (formData: FormData) => {
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
    founderOneDescription: normalizeRequired(
      formData.get("founderOneDescription"),
    ),
    founderOneDescriptionEn: normalizeNullable(
      formData.get("founderOneDescriptionEn"),
    ),
    founderOneImageUrl: normalizeRequired(formData.get("founderOneImageUrl")),
    founderOneImageAlt: normalizeNullable(formData.get("founderOneImageAlt")),
    founderOneImageAltEn: normalizeNullable(
      formData.get("founderOneImageAltEn"),
    ),
    founderTwoName: normalizeRequired(formData.get("founderTwoName")),
    founderTwoNameEn: normalizeNullable(formData.get("founderTwoNameEn")),
    founderTwoRole: normalizeRequired(formData.get("founderTwoRole")),
    founderTwoRoleEn: normalizeNullable(formData.get("founderTwoRoleEn")),
    founderTwoDescription: normalizeRequired(
      formData.get("founderTwoDescription"),
    ),
    founderTwoDescriptionEn: normalizeNullable(
      formData.get("founderTwoDescriptionEn"),
    ),
    founderTwoImageUrl: normalizeRequired(formData.get("founderTwoImageUrl")),
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

  return {
    data: {
      ...values,
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
    const parsed = parseStudioPageContent(formData);
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
