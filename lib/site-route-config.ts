import { getSiteProfile } from "./site-profile";

export type SiteRouteId = string;

export type SitemapFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type SiteRouteData = {
  id: SiteRouteId;
  label: string;
  slug: string;
  translations?: Record<string, { label?: string | null; slug?: string | null }>;
  order: number;
  showInHeader: boolean;
  showInFooter: boolean;
  includeInSitemap: boolean;
  sitemapPriority: number;
  sitemapFrequency: SitemapFrequency;
};

export const sitemapFrequencies: SitemapFrequency[] = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
];

export const defaultSiteRoutes: SiteRouteData[] = getSiteProfile().routes.map(
  (route) => ({
    ...route,
    sitemapFrequency: sitemapFrequencies.includes(
      route.sitemapFrequency as SitemapFrequency,
    )
      ? (route.sitemapFrequency as SitemapFrequency)
      : "monthly",
  }),
);

export const siteRouteIds = defaultSiteRoutes.map((route) => route.id);
const routeIds = new Set<string>(siteRouteIds);

export const isSiteRouteId = (value: string): value is SiteRouteId =>
  routeIds.has(value);

export const normalizeSiteRoutes = (routes: SiteRouteData[]): SiteRouteData[] =>
  defaultSiteRoutes
    .map((defaultRoute) => {
      const route = routes.find((item) => item.id === defaultRoute.id);
      return route ? { ...defaultRoute, ...route } : defaultRoute;
    })
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
