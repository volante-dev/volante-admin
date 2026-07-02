import { getSiteProfile } from "@/lib/site-profile";

export type FooterContentData = {
  id: "footer";
  tagline: string;
  contactHeading: string;
  contactEmail: string;
  contactSocialLabel: string;
  legalText: string;
  madeWithCare: string;
  translations: {
    locale: string;
    tagline: string | null;
    contactHeading: string | null;
    contactEmail: string | null;
    contactSocialLabel: string | null;
    legalText: string | null;
    madeWithCare: string | null;
  }[];
};

export const footerContentDefault: FooterContentData = {
  id: "footer",
  ...getSiteProfile().footer,
};
