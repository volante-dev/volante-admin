"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { normalizeNullable, normalizeRequired } from "@/lib/validation";
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

type HomePageContentValues = {
  eyebrow: string;
  eyebrowEn: string | null;
  title: string;
  titleEn: string | null;
  subheading: string;
  subheadingEn: string | null;
  primaryCtaLabel: string;
  primaryCtaLabelEn: string | null;
  secondaryCtaLabel: string;
  secondaryCtaLabelEn: string | null;
};

type HomePageTranslationField =
  | "eyebrow"
  | "title"
  | "subheading"
  | "primaryCtaLabel"
  | "secondaryCtaLabel";

const homePageTranslationFields = [
  "eyebrow",
  "title",
  "subheading",
  "primaryCtaLabel",
  "secondaryCtaLabel",
] as const satisfies readonly HomePageTranslationField[];

const requiredTextFields = [
  ["eyebrow", "L'eyebrow est obligatoire."],
  ["title", "Le titre est obligatoire."],
  ["subheading", "Le sous-titre est obligatoire."],
  ["primaryCtaLabel", "Le libelle du CTA portfolio est obligatoire."],
  ["secondaryCtaLabel", "Le libelle du CTA contact est obligatoire."],
] as const;

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

const homePageTranslations = (
  contentId: string,
  data: HomePageContentValues,
  translations: LocaleTextTranslations<HomePageTranslationField>,
) => {
  mergeLegacyLocaleTextTranslations(translations, legacyDefaultLocale, {
    eyebrow: data.eyebrow,
    title: data.title,
    subheading: data.subheading,
    primaryCtaLabel: data.primaryCtaLabel,
    secondaryCtaLabel: data.secondaryCtaLabel,
  });
  mergeLegacyLocaleTextTranslations(translations, legacySecondaryLocale, {
    eyebrow: data.eyebrowEn,
    title: data.titleEn,
    subheading: data.subheadingEn,
    primaryCtaLabel: data.primaryCtaLabelEn,
    secondaryCtaLabel: data.secondaryCtaLabelEn,
  });

  return Object.entries(translations).map(([locale, values]) => ({
    contentId,
    locale,
    eyebrow: values.eyebrow ?? null,
    title: values.title ?? null,
    subheading: values.subheading ?? null,
    primaryCtaLabel: values.primaryCtaLabel ?? null,
    secondaryCtaLabel: values.secondaryCtaLabel ?? null,
  }));
};

const parseHomePageContent = (formData: FormData) => {
  const translations = parseLocaleTextTranslations(
    formData,
    homePageTranslationFields,
  );
  const values = {
    eyebrow:
      legacyDefaultTextValue(translations, "eyebrow") ??
      normalizeRequired(formData.get("eyebrow")),
    eyebrowEn:
      legacySecondaryTextValue(translations, "eyebrow") ??
      normalizeNullable(formData.get("eyebrowEn")),
    title:
      legacyDefaultTextValue(translations, "title") ??
      normalizeRequired(formData.get("title")),
    titleEn:
      legacySecondaryTextValue(translations, "title") ??
      normalizeNullable(formData.get("titleEn")),
    subheading:
      legacyDefaultTextValue(translations, "subheading") ??
      normalizeRequired(formData.get("subheading")),
    subheadingEn:
      legacySecondaryTextValue(translations, "subheading") ??
      normalizeNullable(formData.get("subheadingEn")),
    primaryCtaLabel:
      legacyDefaultTextValue(translations, "primaryCtaLabel") ??
      normalizeRequired(formData.get("primaryCtaLabel")),
    primaryCtaLabelEn:
      legacySecondaryTextValue(translations, "primaryCtaLabel") ??
      normalizeNullable(formData.get("primaryCtaLabelEn")),
    secondaryCtaLabel:
      legacyDefaultTextValue(translations, "secondaryCtaLabel") ??
      normalizeRequired(formData.get("secondaryCtaLabel")),
    secondaryCtaLabelEn:
      legacySecondaryTextValue(translations, "secondaryCtaLabel") ??
      normalizeNullable(formData.get("secondaryCtaLabelEn")),
  };

  for (const [field, message] of requiredTextFields) {
    if (values[field].length < 2) return { error: message } as const;
  }

  return { data: values, translations } as const;
};

export const updateHomePageContent = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseHomePageContent(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction([
      prisma.homePageContent.upsert({
        where: { id: "home" },
        create: { id: "home", ...parsed.data },
        update: parsed.data,
      }),
      ...homePageTranslations("home", parsed.data, parsed.translations).map((translation) =>
        prisma.homePageContentTranslation.upsert({
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
            subheading: translation.subheading,
            primaryCtaLabel: translation.primaryCtaLabel,
            secondaryCtaLabel: translation.secondaryCtaLabel,
          },
        }),
      ),
    ]);

    revalidatePath("/pages/home");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
