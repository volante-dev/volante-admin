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
  eyebrowEn: string | null;
  title: string;
  titleEn: string | null;
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
    eyebrowEn: "About us",
    title: "Un studio indépendant, une vision singulière.",
    titleEn: "An independent studio with a singular vision.",
  },
  services: {
    id: "services",
    eyebrow: "Notre expertise",
    eyebrowEn: "Our expertise",
    title: "Des services pensés pour faire rayonner votre marque.",
    titleEn: "Services designed to make your brand shine.",
  },
  portfolio: {
    id: "portfolio",
    eyebrow: "Nos réalisations",
    eyebrowEn: "Selected work",
    title: "Des projets construits avec exigence.",
    titleEn: "Projects crafted with care and precision.",
  },
  contact: {
    id: "contact",
    eyebrow: "Nous contacter",
    eyebrowEn: "Contact us",
    title: "Parlons de votre projet.",
    titleEn: "Let's talk about your project.",
  },
};

export const isPageHeaderId = (value: string): value is PageHeaderId =>
  pageHeaderIds.includes(value as PageHeaderId);
