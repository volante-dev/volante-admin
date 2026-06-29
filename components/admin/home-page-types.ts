import {
  defaultSiteLocaleCode,
  initialTranslatedLocaleCode,
} from "@/lib/admin-translations";

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
  eyebrow: "Agence de communication créative",
  title: "Nous donnons vie aux idées qui méritent d'exister.",
  subheading:
    "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
  primaryCtaLabel: "Voir nos projets",
  secondaryCtaLabel: "Travailler ensemble",
  translations: [
    {
      locale: defaultSiteLocaleCode,
      eyebrow: "Agence de communication créative",
      title: "Nous donnons vie aux idées qui méritent d'exister.",
      subheading:
        "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
      primaryCtaLabel: "Voir nos projets",
      secondaryCtaLabel: "Travailler ensemble",
    },
    {
      locale: initialTranslatedLocaleCode,
      eyebrow: "Creative communication agency",
      title: "We bring ideas worth sharing to life.",
      subheading:
        "Studio Volante helps ambitious brands shape their communication — visual identity, content strategy and art direction.",
      primaryCtaLabel: "View our work",
      secondaryCtaLabel: "Work with us",
    },
  ],
};
