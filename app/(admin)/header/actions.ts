"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import {
  defaultSiteRoutes,
  isSiteRouteId,
  siteRouteIds,
  sitemapFrequencies,
  type SiteRouteData,
} from "@/lib/site-route-config";

type ActionResult = {
  success: boolean;
  error?: string;
};

type SiteRoutePayload = Partial<SiteRouteData>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ids = new Set<string>(siteRouteIds);
const frequencySet = new Set<string>(sitemapFrequencies);

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

const hasDuplicates = (values: string[]) => new Set(values).size !== values.length;

const parseSiteRoutes = (formData: FormData) => {
  const raw = formData.get("items");
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "La configuration de navigation est vide." } as const;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "La configuration de navigation est invalide." } as const;
  }

  if (!Array.isArray(parsed)) {
    return { error: "La configuration de navigation est invalide." } as const;
  }

  if (parsed.length !== siteRouteIds.length) {
    return { error: "Toutes les routes du site doivent etre presentes." } as const;
  }

  const items = parsed.map((item, index) => {
    const value = item as SiteRoutePayload;
    const defaultRoute = defaultSiteRoutes.find((route) => route.id === value.id);
    return {
      id: normalize(value.id),
      label: normalize(value.label),
      labelEn: normalize(value.labelEn),
      slug: value.id === "home" ? "" : normalize(value.slug),
      slugEn: value.id === "home" ? "" : normalize(value.slugEn),
      order: index,
      showInHeader: value.id === "home" ? false : Boolean(value.showInHeader),
      showInFooter: value.id === "home" ? false : Boolean(value.showInFooter),
      includeInSitemap: value.includeInSitemap !== false,
      sitemapPriority:
        typeof value.sitemapPriority === "number"
          ? Math.min(1, Math.max(0, value.sitemapPriority))
          : defaultRoute?.sitemapPriority ?? 0.7,
      sitemapFrequency: frequencySet.has(String(value.sitemapFrequency))
        ? String(value.sitemapFrequency)
        : defaultRoute?.sitemapFrequency ?? "monthly",
    };
  });

  if (items.some((item) => !isSiteRouteId(item.id) || !ids.has(item.id))) {
    return { error: "Une route est invalide." } as const;
  }

  if (hasDuplicates(items.map((item) => item.id))) {
    return { error: "Une route est presente plusieurs fois." } as const;
  }

  for (const item of items) {
    if (!item.label || !item.labelEn) {
      return { error: "Tous les intitules sont obligatoires." } as const;
    }
    if (
      item.id !== "home" &&
      (!slugPattern.test(item.slug) || !slugPattern.test(item.slugEn))
    ) {
      return {
        error:
          "Les slugs doivent contenir uniquement des minuscules, chiffres et tirets.",
      } as const;
    }
  }

  if (hasDuplicates(items.filter((item) => item.slug).map((item) => item.slug))) {
    return { error: "Les slugs francais doivent etre uniques." } as const;
  }

  if (hasDuplicates(items.filter((item) => item.slugEn).map((item) => item.slugEn))) {
    return { error: "Les slugs anglais doivent etre uniques." } as const;
  }

  return { data: items as SiteRouteData[] } as const;
};

export const updateSiteRoutes = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseSiteRoutes(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction(
      parsed.data.map((item) =>
        prisma.siteRoute.upsert({
          where: { id: item.id },
          create: item,
          update: {
            label: item.label,
            labelEn: item.labelEn,
            slug: item.slug,
            slugEn: item.slugEn,
            order: item.order,
            showInHeader: item.showInHeader,
            showInFooter: item.showInFooter,
            includeInSitemap: item.includeInSitemap,
            sitemapPriority: item.sitemapPriority,
            sitemapFrequency: item.sitemapFrequency,
          },
        }),
      ),
    );

    revalidatePath("/header");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
