import prisma from "@/lib/prisma";
import {
  defaultSiteRoutes,
  isSiteRouteId,
  normalizeSiteRoutes,
  sitemapFrequencies,
  type SiteRouteData,
  type SitemapFrequency,
} from "./site-route-config";

const toSitemapFrequency = (value: string): SitemapFrequency =>
  sitemapFrequencies.includes(value as SitemapFrequency)
    ? (value as SitemapFrequency)
    : "monthly";

export const getSiteRoutes = async (): Promise<SiteRouteData[]> => {
  const routes = await prisma.siteRoute.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });

  if (!routes.length) return defaultSiteRoutes;

  return normalizeSiteRoutes(
    routes
      .filter((route) => isSiteRouteId(route.id))
      .map((route) => ({
        id: route.id as SiteRouteData["id"],
        label: route.label,
        labelEn: route.labelEn,
        slug: route.slug,
        slugEn: route.slugEn,
        order: route.order,
        showInHeader: route.showInHeader,
        showInFooter: route.showInFooter,
        includeInSitemap: route.includeInSitemap,
        sitemapPriority: route.sitemapPriority,
        sitemapFrequency: toSitemapFrequency(route.sitemapFrequency),
      })),
  );
};
