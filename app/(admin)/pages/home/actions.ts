"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { normalizeNullable, normalizeRequired } from "@/lib/validation";

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
) => [
  {
    contentId,
    locale: "fr",
    eyebrow: data.eyebrow,
    title: data.title,
    subheading: data.subheading,
    primaryCtaLabel: data.primaryCtaLabel,
    secondaryCtaLabel: data.secondaryCtaLabel,
  },
  {
    contentId,
    locale: "en",
    eyebrow: data.eyebrowEn,
    title: data.titleEn,
    subheading: data.subheadingEn,
    primaryCtaLabel: data.primaryCtaLabelEn,
    secondaryCtaLabel: data.secondaryCtaLabelEn,
  },
];

const parseHomePageContent = (formData: FormData) => {
  const values = {
    eyebrow: normalizeRequired(formData.get("eyebrow")),
    eyebrowEn: normalizeNullable(formData.get("eyebrowEn")),
    title: normalizeRequired(formData.get("title")),
    titleEn: normalizeNullable(formData.get("titleEn")),
    subheading: normalizeRequired(formData.get("subheading")),
    subheadingEn: normalizeNullable(formData.get("subheadingEn")),
    primaryCtaLabel: normalizeRequired(formData.get("primaryCtaLabel")),
    primaryCtaLabelEn: normalizeNullable(formData.get("primaryCtaLabelEn")),
    secondaryCtaLabel: normalizeRequired(formData.get("secondaryCtaLabel")),
    secondaryCtaLabelEn: normalizeNullable(
      formData.get("secondaryCtaLabelEn"),
    ),
  };

  for (const [field, message] of requiredTextFields) {
    if (values[field].length < 2) return { error: message } as const;
  }

  return { data: values } as const;
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
      ...homePageTranslations("home", parsed.data).map((translation) =>
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
