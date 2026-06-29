import {
  legacyDefaultLocale,
  legacySecondaryLocale,
} from "@/lib/admin-translations";

export type HomePageContentData = {
  id: "home";
  eyebrow: string;
  eyebrowEn: string | null;
  title: string;
  titleEn: string | null;
  subheading: string;
  subheadingEn: string | null;
  primaryCtaLabel: string;
  primaryCtaLabelEn: string | null;
  secondaryCtaLabel: string;
  secondaryCtaLabelEn: string | null;
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
  eyebrow: "Agence de communication créative",
  eyebrowEn: "Creative communication agency",
  title: "Nous donnons vie aux idées qui méritent d'exister.",
  titleEn: "We bring ideas worth sharing to life.",
  subheading:
    "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
  subheadingEn:
    "Studio Volante helps ambitious brands shape their communication — visual identity, content strategy and art direction.",
  primaryCtaLabel: "Voir nos projets",
  primaryCtaLabelEn: "View our work",
  secondaryCtaLabel: "Travailler ensemble",
  secondaryCtaLabelEn: "Work with us",
  translations: [
    {
      locale: legacyDefaultLocale,
      eyebrow: "Agence de communication créative",
      title: "Nous donnons vie aux idées qui méritent d'exister.",
      subheading:
        "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
      primaryCtaLabel: "Voir nos projets",
      secondaryCtaLabel: "Travailler ensemble",
    },
    {
      locale: legacySecondaryLocale,
      eyebrow: "Creative communication agency",
      title: "We bring ideas worth sharing to life.",
      subheading:
        "Studio Volante helps ambitious brands shape their communication — visual identity, content strategy and art direction.",
      primaryCtaLabel: "View our work",
      secondaryCtaLabel: "Work with us",
    },
  ],
};
