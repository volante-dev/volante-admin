import {
  defaultSiteLocaleCode,
  initialTranslatedLocaleCode,
} from "@/lib/admin-translations";

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
  tagline:
    "Agence de communication créative. Nous donnons vie aux idées qui comptent.",
  contactHeading: "Contact",
  contactEmail: "yasmine@studio-volante.fr",
  contactSocialLabel: "@vlnt.studio",
  legalText: "Studio Volante. Tous droits réservés.",
  madeWithCare: "Fait avec soin à Paris",
  translations: [
    {
      locale: defaultSiteLocaleCode,
      tagline:
        "Agence de communication créative. Nous donnons vie aux idées qui comptent.",
      contactHeading: "Contact",
      contactEmail: "yasmine@studio-volante.fr",
      contactSocialLabel: "@vlnt.studio",
      legalText: "Studio Volante. Tous droits réservés.",
      madeWithCare: "Fait avec soin à Paris",
    },
    {
      locale: initialTranslatedLocaleCode,
      tagline: "Creative communication agency. We bring meaningful ideas to life.",
      contactHeading: "Contact",
      contactEmail: "yasmine@studio-volante.fr",
      contactSocialLabel: "@vlnt.studio",
      legalText: "Studio Volante. All rights reserved.",
      madeWithCare: "Made with care in Paris",
    },
  ],
};
