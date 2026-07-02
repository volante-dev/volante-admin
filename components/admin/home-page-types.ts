import { getSiteProfile } from "@/lib/site-profile";

export type HomePageContentData = {
  id: "home";
  eyebrow: string;
  title: string;
  subheading: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  translations: {
    locale: string;
    eyebrow: string | null;
    title: string | null;
    subheading: string | null;
    primaryCtaLabel: string | null;
    secondaryCtaLabel: string | null;
  }[];
};

export const homePageContentDefault: HomePageContentData = {
  id: "home",
  ...getSiteProfile().homePage,
};
