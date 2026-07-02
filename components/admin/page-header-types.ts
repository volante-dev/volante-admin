import { getSiteProfile } from "@/lib/site-profile";

export type PageHeaderId = string;

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

export const pageHeaderIds = getSiteProfile().pageHeaders.map(
  (pageHeader) => pageHeader.id,
);

export const pageHeaderLabels: Record<PageHeaderId, string> = Object.fromEntries(
  getSiteProfile().pageHeaders.map((pageHeader) => [
    pageHeader.id,
    pageHeader.label,
  ]),
);

export const pageHeaderDefaults: Record<PageHeaderId, PageHeaderContentData> =
  Object.fromEntries(
    getSiteProfile().pageHeaders.map((pageHeader) => [
      pageHeader.id,
      {
        id: pageHeader.id,
        eyebrow: pageHeader.eyebrow,
        title: pageHeader.title,
        intro: pageHeader.intro,
        translations: [],
      },
    ]),
  );

export const pageHeaderIdsWithDedicatedAdmin = new Set(
  getSiteProfile()
    .pageHeaders.filter((pageHeader) => pageHeader.dedicatedAdmin)
    .map((pageHeader) => pageHeader.id),
);

export const isPageHeaderId = (value: string): value is PageHeaderId =>
  pageHeaderIds.includes(value);
