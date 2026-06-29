export const siteRouteIds = [
  "home",
  "services",
  "portfolio",
  "trailblaze",
  "studio",
  "contact",
] as const;

export type SiteRouteId = (typeof siteRouteIds)[number];

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
  labelEn: string;
  slug: string;
  slugEn: string;
  translations?: Record<string, { label?: string | null; slug?: string | null }>;
  order: number;
  showInHeader: boolean;
  showInFooter: boolean;
  includeInSitemap: boolean;
  sitemapPriority: number;
  sitemapFrequency: SitemapFrequency;
};

export const defaultSiteRoutes: SiteRouteData[] = [
  {
    id: "home",
    label: "Accueil",
    labelEn: "Home",
    slug: "",
    slugEn: "",
    order: 0,
    showInHeader: false,
    showInFooter: false,
    includeInSitemap: true,
    sitemapPriority: 1,
    sitemapFrequency: "weekly",
  },
  {
    id: "services",
    label: "Services",
    labelEn: "Services",
    slug: "services",
    slugEn: "services",
    order: 1,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.8,
    sitemapFrequency: "monthly",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    labelEn: "Portfolio",
    slug: "portfolio",
    slugEn: "portfolio",
    order: 2,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.9,
    sitemapFrequency: "monthly",
  },
  {
    id: "trailblaze",
    label: "Trailblaze",
    labelEn: "Trailblaze",
    slug: "trailblaze",
    slugEn: "trailblaze",
    order: 3,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.7,
    sitemapFrequency: "monthly",
  },
  {
    id: "studio",
    label: "Studio",
    labelEn: "Studio",
    slug: "studio",
    slugEn: "studio",
    order: 4,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.7,
    sitemapFrequency: "monthly",
  },
  {
    id: "contact",
    label: "Contact",
    labelEn: "Contact",
    slug: "contact",
    slugEn: "contact",
    order: 5,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.6,
    sitemapFrequency: "monthly",
  },
];

const routeIds = new Set<string>(siteRouteIds);

export const sitemapFrequencies: SitemapFrequency[] = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
];

export const isSiteRouteId = (value: string): value is SiteRouteId =>
  routeIds.has(value);

export const normalizeSiteRoutes = (routes: SiteRouteData[]): SiteRouteData[] =>
  defaultSiteRoutes
    .map((defaultRoute) => {
      const route = routes.find((item) => item.id === defaultRoute.id);
      return route ? { ...defaultRoute, ...route } : defaultRoute;
    })
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
