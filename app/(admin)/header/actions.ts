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
import {
  defaultSiteLocaleCode,
} from "@/lib/admin-translations";

type ActionResult = {
  success: boolean;
  error?: string;
};

type SiteRoutePayload = Partial<SiteRouteData>;
type ParsedSiteRoute = SiteRouteData & {
  normalizedTranslations: Array<{
    locale: string;
    label: string;
    slug: string;
  }>;
};

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

const parseTranslations = (value: SiteRoutePayload, isHome: boolean) => {
  const customTranslations =
    value.translations && typeof value.translations === "object"
      ? Object.entries(value.translations).map(([locale, translation]) => {
          const entry = translation ?? {};
          return {
            locale: normalize(locale).toLowerCase(),
            label: normalize(entry.label),
            slug: isHome ? "" : normalize(entry.slug),
          };
        })
      : [];

  return [
    {
      locale: defaultSiteLocaleCode,
      label: normalize(value.label),
      slug: isHome ? "" : normalize(value.slug),
    },
    ...customTranslations.filter((translation) => translation.locale !== defaultSiteLocaleCode),
  ];
};

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
    const isHome = value.id === "home";
    const normalizedTranslations = parseTranslations(value, isHome);
    return {
      id: normalize(value.id),
      label: normalize(value.label),
      slug: isHome ? "" : normalize(value.slug),
      translations: Object.fromEntries(
        normalizedTranslations.map((translation) => [
          translation.locale,
          {
            label: translation.label,
            slug: translation.slug,
          },
        ]),
      ),
      normalizedTranslations,
      order: index,
      showInHeader: isHome ? false : Boolean(value.showInHeader),
      showInFooter: isHome ? false : Boolean(value.showInFooter),
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
    if (
      item.normalizedTranslations.some((translation) => !translation.label)
    ) {
      return { error: "Tous les intitules sont obligatoires." } as const;
    }
    if (
      item.id !== "home" &&
      item.normalizedTranslations.some(
        (translation) => !slugPattern.test(translation.slug),
      )
    ) {
      return {
        error:
          "Les slugs doivent contenir uniquement des minuscules, chiffres et tirets.",
      } as const;
    }
  }

  const locales = new Set(
    items.flatMap((item) =>
      item.normalizedTranslations.map((translation) => translation.locale),
    ),
  );
  for (const locale of locales) {
    const slugs = items
      .flatMap((item) =>
        item.normalizedTranslations
          .filter((translation) => translation.locale === locale)
          .map((translation) => translation.slug),
      )
      .filter(Boolean);
    if (hasDuplicates(slugs)) {
      return { error: `Les slugs ${locale} doivent etre uniques.` } as const;
    }
  }

  return { data: items as ParsedSiteRoute[] } as const;
};

export const updateSiteRoutes = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseSiteRoutes(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction([
      ...parsed.data.map((item) =>
        prisma.siteRoute.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            label: item.label,
            slug: item.slug,
            order: item.order,
            showInHeader: item.showInHeader,
            showInFooter: item.showInFooter,
            includeInSitemap: item.includeInSitemap,
            sitemapPriority: item.sitemapPriority,
            sitemapFrequency: item.sitemapFrequency,
          },
          update: {
            label: item.label,
            slug: item.slug,
            order: item.order,
            showInHeader: item.showInHeader,
            showInFooter: item.showInFooter,
            includeInSitemap: item.includeInSitemap,
            sitemapPriority: item.sitemapPriority,
            sitemapFrequency: item.sitemapFrequency,
          },
        }),
      ),
      ...parsed.data.flatMap((item) =>
        item.normalizedTranslations.map((translation) =>
          prisma.siteRouteTranslation.upsert({
            where: {
              routeId_locale: {
                routeId: item.id,
                locale: translation.locale,
              },
            },
            create: {
              routeId: item.id,
              locale: translation.locale,
              label: translation.label,
              slug: translation.slug,
            },
            update: {
              label: translation.label,
              slug: translation.slug,
            },
          }),
        ),
      ),
    ]);

    revalidatePath("/header");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
