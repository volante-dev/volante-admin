"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { normalizeRequired } from "@/lib/validation";
import {
  defaultLocaleTextValue,
  defaultSiteLocaleCode,
  mergeLocaleTextTranslations,
  parseLocaleTextTranslations,
  type LocaleTextTranslations,
} from "@/lib/admin-translations";

type ActionResult = {
  success: boolean;
  error?: string;
};

type FooterContentValues = {
  tagline: string;
  contactHeading: string;
  contactEmail: string;
  contactSocialLabel: string;
  legalText: string;
  madeWithCare: string;
};

type FooterContentField = keyof FooterContentValues;

const footerContentFields = [
  "tagline",
  "contactHeading",
  "contactEmail",
  "contactSocialLabel",
  "legalText",
  "madeWithCare",
] as const satisfies readonly FooterContentField[];

const requiredTextFields = [
  ["tagline", "Le sous-titre du footer est obligatoire."],
  ["contactHeading", "Le titre du bloc contact est obligatoire."],
  ["contactEmail", "L'email de contact est obligatoire."],
  ["contactSocialLabel", "Le lien social est obligatoire."],
  ["legalText", "La mention legale est obligatoire."],
  ["madeWithCare", "La mention fait avec soin est obligatoire."],
] as const satisfies readonly [FooterContentField, string][];

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

const footerContentTranslations = (
  contentId: string,
  data: FooterContentValues,
  translations: LocaleTextTranslations<FooterContentField>,
) => {
  mergeLocaleTextTranslations(translations, defaultSiteLocaleCode, data);

  return Object.entries(translations).map(([locale, values]) => ({
    contentId,
    locale,
    tagline: values.tagline ?? null,
    contactHeading: values.contactHeading ?? null,
    contactEmail: values.contactEmail ?? null,
    contactSocialLabel: values.contactSocialLabel ?? null,
    legalText: values.legalText ?? null,
    madeWithCare: values.madeWithCare ?? null,
  }));
};

const parseFooterContent = (formData: FormData) => {
  const translations = parseLocaleTextTranslations(formData, footerContentFields);
  const values = {
    tagline:
      defaultLocaleTextValue(translations, "tagline") ??
      normalizeRequired(formData.get("tagline")),
    contactHeading:
      defaultLocaleTextValue(translations, "contactHeading") ??
      normalizeRequired(formData.get("contactHeading")),
    contactEmail:
      defaultLocaleTextValue(translations, "contactEmail") ??
      normalizeRequired(formData.get("contactEmail")),
    contactSocialLabel:
      defaultLocaleTextValue(translations, "contactSocialLabel") ??
      normalizeRequired(formData.get("contactSocialLabel")),
    legalText:
      defaultLocaleTextValue(translations, "legalText") ??
      normalizeRequired(formData.get("legalText")),
    madeWithCare:
      defaultLocaleTextValue(translations, "madeWithCare") ??
      normalizeRequired(formData.get("madeWithCare")),
  };

  for (const [field, message] of requiredTextFields) {
    if (values[field].length < 2) return { error: message } as const;
  }

  return { data: values, translations } as const;
};

export const updateFooterContent = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseFooterContent(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction([
      prisma.footerContent.upsert({
        where: { id: "footer" },
        create: { id: "footer", ...parsed.data },
        update: parsed.data,
      }),
      ...footerContentTranslations("footer", parsed.data, parsed.translations).map(
        (translation) =>
          prisma.footerContentTranslation.upsert({
            where: {
              contentId_locale: {
                contentId: translation.contentId,
                locale: translation.locale,
              },
            },
            create: translation,
            update: {
              tagline: translation.tagline,
              contactHeading: translation.contactHeading,
              contactEmail: translation.contactEmail,
              contactSocialLabel: translation.contactSocialLabel,
              legalText: translation.legalText,
              madeWithCare: translation.madeWithCare,
            },
          }),
      ),
    ]);

    revalidatePath("/");
    revalidatePath("/pages/footer");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
