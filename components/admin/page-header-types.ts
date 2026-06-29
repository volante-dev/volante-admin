export const pageHeaderIds = [
  "studio",
  "services",
  "portfolio",
  "contact",
] as const;

export type PageHeaderId = (typeof pageHeaderIds)[number];

export type PageHeaderContentData = {
  id: PageHeaderId;
  eyebrow: string;
  title: string;
  intro: string | null;
  translations: {
    locale: string;
    eyebrow: string | null;
    title: string | null;
    intro: string | null;
  }[];
};

export const pageHeaderLabels: Record<PageHeaderId, string> = {
  studio: "Studio",
  services: "Services",
  portfolio: "Portfolio",
  contact: "Contact",
};

export const pageHeaderDefaults: Record<PageHeaderId, PageHeaderContentData> = {
  studio: {
    id: "studio",
    eyebrow: "Qui sommes-nous",
    title: "Un studio indépendant, une vision singulière.",
    intro: null,
    translations: [],
  },
  services: {
    id: "services",
    eyebrow: "Notre expertise",
    title: "Des services pensés pour faire rayonner votre marque.",
    intro: null,
    translations: [],
  },
  portfolio: {
    id: "portfolio",
    eyebrow: "Nos réalisations",
    title: "Des projets construits avec exigence.",
    intro: null,
    translations: [],
  },
  contact: {
    id: "contact",
    eyebrow: "Nous contacter",
    title: "Parlons de votre projet.",
    intro: null,
    translations: [],
  },
};

export const isPageHeaderId = (value: string): value is PageHeaderId =>
  pageHeaderIds.includes(value as PageHeaderId);
