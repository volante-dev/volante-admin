import prisma from "@/lib/prisma";
import {
  defaultSiteLocaleCode,
  initialTranslatedLocaleCode,
} from "@/lib/admin-translations";

export type SiteLocaleData = {
  code: string;
  label: string;
  nativeLabel: string;
  hreflang: string;
  isDefault: boolean;
  enabledInAdmin: boolean;
  publishedOnFront: boolean;
  aiEnabled: boolean;
  order: number;
};

export const defaultSiteLocales: SiteLocaleData[] = [
  {
    code: defaultSiteLocaleCode,
    label: "Français",
    nativeLabel: "Français",
    hreflang: "fr-FR",
    isDefault: true,
    enabledInAdmin: true,
    publishedOnFront: true,
    aiEnabled: false,
    order: 0,
  },
  {
    code: initialTranslatedLocaleCode,
    label: "Anglais",
    nativeLabel: "English",
    hreflang: "en",
    isDefault: false,
    enabledInAdmin: true,
    publishedOnFront: true,
    aiEnabled: true,
    order: 1,
  },
];

export const getSiteLocales = async (): Promise<SiteLocaleData[]> => {
  const locales = await prisma.siteLocale.findMany({
    orderBy: [{ order: "asc" }, { code: "asc" }],
  });

  if (!locales.length) return defaultSiteLocales;

  return locales.map((locale) => ({
    code: locale.code,
    label: locale.label,
    nativeLabel: locale.nativeLabel,
    hreflang: locale.hreflang,
    isDefault: locale.isDefault,
    enabledInAdmin: locale.enabledInAdmin,
    publishedOnFront: locale.publishedOnFront,
    aiEnabled: locale.aiEnabled,
    order: locale.order,
  }));
};
