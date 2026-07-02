import prisma from "@/lib/prisma";
import { getSiteProfile } from "@/lib/site-profile";

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

export const defaultSiteLocales: SiteLocaleData[] = getSiteProfile().locales;

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
