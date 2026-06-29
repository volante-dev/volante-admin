"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import type { SiteLocaleData } from "@/lib/site-locales";

type ActionResult = {
  success: boolean;
  error?: string;
};

const localeCodePattern = /^[a-z]{2}(?:-[a-z0-9]{2,8})?$/;
const hreflangPattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

const parseLocales = (formData: FormData) => {
  const raw = formData.get("locales");
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "La configuration des langues est vide." } as const;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "La configuration des langues est invalide." } as const;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: "Au moins une langue est obligatoire." } as const;
  }

  const locales = parsed.map((item, index) => {
    const value = item as Partial<SiteLocaleData>;
    const code = normalizeString(value.code).toLowerCase();
    return {
      code,
      label: normalizeString(value.label),
      nativeLabel: normalizeString(value.nativeLabel),
      hreflang: normalizeString(value.hreflang),
      isDefault: Boolean(value.isDefault),
      enabledInAdmin: Boolean(value.enabledInAdmin),
      publishedOnFront: Boolean(value.publishedOnFront),
      aiEnabled: Boolean(value.aiEnabled),
      order: index,
    };
  });

  const codes = locales.map((locale) => locale.code);
  if (new Set(codes).size !== codes.length) {
    return { error: "Chaque code langue doit etre unique." } as const;
  }

  for (const locale of locales) {
    if (!localeCodePattern.test(locale.code)) {
      return {
        error:
          "Les codes langue doivent suivre le format ISO court, par exemple fr, en ou es.",
      } as const;
    }
    if (!locale.label || !locale.nativeLabel) {
      return { error: "Les intitules des langues sont obligatoires." } as const;
    }
    if (!hreflangPattern.test(locale.hreflang)) {
      return {
        error:
          "Le hreflang doit suivre un format comme fr-FR, en, es ou de-DE.",
      } as const;
    }
  }

  const defaultLocales = locales.filter((locale) => locale.isDefault);
  if (defaultLocales.length !== 1) {
    return { error: "Une seule langue doit etre definie comme langue par defaut." } as const;
  }

  return {
    data: locales.map((locale) =>
      locale.isDefault
        ? {
            ...locale,
            enabledInAdmin: true,
            publishedOnFront: true,
          }
        : locale,
    ),
  } as const;
};

export const updateSiteLocales = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseLocales(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction(
      parsed.data.map((locale) =>
        prisma.siteLocale.upsert({
          where: { code: locale.code },
          create: locale,
          update: {
            label: locale.label,
            nativeLabel: locale.nativeLabel,
            hreflang: locale.hreflang,
            isDefault: locale.isDefault,
            enabledInAdmin: locale.enabledInAdmin,
            publishedOnFront: locale.publishedOnFront,
            aiEnabled: locale.aiEnabled,
            order: locale.order,
          },
        }),
      ),
    );

    revalidatePath("/settings/languages");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
