export type AdminIconKey =
  | "article"
  | "autoAwesome"
  | "build"
  | "category"
  | "dashboard"
  | "folder"
  | "media"
  | "quote"
  | "settings"
  | "translate";

export type AdminNavItemConfig = {
  id: string;
  label: string;
  href: string;
  icon: AdminIconKey;
  enabled?: boolean;
  disabled?: boolean;
};

export type AdminNavGroupConfig = {
  title?: string;
  items: AdminNavItemConfig[];
};

export type SiteLocaleProfile = {
  code: string;
  label: string;
  nativeLabel: string;
  hreflang: string;
  isDefault: boolean;
  enabledInAdmin: boolean;
  publishedOnFront: boolean;
  aiEnabled: boolean;
  order: number;
};

export type SiteRouteProfile = {
  id: string;
  label: string;
  slug: string;
  translations?: Record<string, { label?: string | null; slug?: string | null }>;
  order: number;
  showInHeader: boolean;
  showInFooter: boolean;
  includeInSitemap: boolean;
  sitemapPriority: number;
  sitemapFrequency: string;
};

export type PageHeaderProfile = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  intro: string | null;
  dedicatedAdmin?: boolean;
};

export type HomePageProfile = {
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

export type FooterProfile = {
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

export type StudioPageProfile = {
  eyebrow: string;
  title: string;
  intro: string;
  founderOneName: string;
  founderOneRole: string;
  founderOneDescription: string;
  founderOneImageUrl: string;
  founderOneImageAlt: string | null;
  founderTwoName: string;
  founderTwoRole: string;
  founderTwoDescription: string;
  founderTwoImageUrl: string;
  founderTwoImageAlt: string | null;
  historyTitle: string;
  historyContentHtml: string;
};

export type SiteProfile = {
  key: string;
  appName: string;
  adminTitle: string;
  adminDescription: string;
  loginSubtitle: string;
  loginButtonLabel: string;
  cookiePrefix: string;
  aiSiteDescription: string;
  locales: SiteLocaleProfile[];
  routes: SiteRouteProfile[];
  pageHeaders: PageHeaderProfile[];
  adminNav: AdminNavGroupConfig[];
  settingsNav: AdminNavItemConfig[];
  homePage: HomePageProfile;
  footer: FooterProfile;
  studioPage: StudioPageProfile;
  indexNowProjectPaths: (slug: string) => string[];
};

const genericLocales: SiteLocaleProfile[] = [
  {
    code: "fr",
    label: "Francais",
    nativeLabel: "Francais",
    hreflang: "fr-FR",
    isDefault: true,
    enabledInAdmin: true,
    publishedOnFront: true,
    aiEnabled: false,
    order: 0,
  },
  {
    code: "en",
    label: "Anglais",
    nativeLabel: "English",
    hreflang: "en",
    isDefault: false,
    enabledInAdmin: true,
    publishedOnFront: true,
    aiEnabled: true,
    order: 1,
  },
];

const genericRoutes: SiteRouteProfile[] = [
  {
    id: "home",
    label: "Accueil",
    slug: "",
    translations: { en: { label: "Home", slug: "" } },
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
    slug: "services",
    translations: { en: { label: "Services", slug: "services" } },
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
    slug: "portfolio",
    translations: { en: { label: "Portfolio", slug: "portfolio" } },
    order: 2,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.9,
    sitemapFrequency: "monthly",
  },
  {
    id: "trailblaze",
    label: "Articles",
    slug: "articles",
    translations: { en: { label: "Articles", slug: "articles" } },
    order: 3,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.7,
    sitemapFrequency: "monthly",
  },
  {
    id: "studio",
    label: "A propos",
    slug: "a-propos",
    translations: { en: { label: "About", slug: "about" } },
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
    slug: "contact",
    translations: { en: { label: "Contact", slug: "contact" } },
    order: 5,
    showInHeader: true,
    showInFooter: true,
    includeInSitemap: true,
    sitemapPriority: 0.6,
    sitemapFrequency: "monthly",
  },
];

const genericPageHeaders: PageHeaderProfile[] = [
  {
    id: "studio",
    label: "A propos",
    eyebrow: "A propos",
    title: "Une equipe, une approche, une histoire.",
    intro: null,
    dedicatedAdmin: true,
  },
  {
    id: "services",
    label: "Services",
    eyebrow: "Expertise",
    title: "Des services adaptes a vos objectifs.",
    intro: null,
  },
  {
    id: "portfolio",
    label: "Portfolio",
    eyebrow: "Realisations",
    title: "Des projets construits avec exigence.",
    intro: null,
  },
  {
    id: "contact",
    label: "Contact",
    eyebrow: "Contact",
    title: "Parlons de votre projet.",
    intro: null,
  },
];

const adminNav: AdminNavGroupConfig[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: "dashboard" },
      { id: "services", label: "Services", href: "/services", icon: "build" },
      {
        id: "studio-values",
        label: "Valeurs",
        href: "/studio-values",
        icon: "autoAwesome",
      },
      { id: "projects", label: "Projects", href: "/projects", icon: "folder" },
      {
        id: "media-assets",
        label: "Galerie de medias",
        href: "/media-assets",
        icon: "media",
      },
      {
        id: "project-taxonomies",
        label: "Taxonomies",
        href: "/project-taxonomies",
        icon: "category",
      },
      {
        id: "trailblaze",
        label: "Articles",
        href: "/trailblaze",
        icon: "article",
      },
      {
        id: "testimonials",
        label: "Testimonials",
        href: "/testimonials",
        icon: "quote",
        disabled: true,
      },
    ],
  },
  {
    title: "Pages",
    items: [
      { id: "page-home", label: "Accueil", href: "/pages/home", icon: "article" },
      { id: "page-studio", label: "A propos", href: "/pages/studio", icon: "article" },
      { id: "page-services", label: "Services", href: "/pages/services", icon: "article" },
      { id: "page-portfolio", label: "Portfolio", href: "/pages/portfolio", icon: "article" },
      { id: "page-contact", label: "Contact", href: "/pages/contact", icon: "article" },
      { id: "page-footer", label: "Footer", href: "/pages/footer", icon: "article" },
    ],
  },
];

const settingsNav: AdminNavItemConfig[] = [
  { id: "header", label: "Header", href: "/header", icon: "settings" },
  {
    id: "languages",
    label: "Langues",
    href: "/settings/languages",
    icon: "translate",
  },
];

const genericProfile: SiteProfile = {
  key: "generic",
  appName: "Generic Admin",
  adminTitle: "Generic Admin",
  adminDescription: "Admin panel generique",
  loginSubtitle: "Portail d'administration",
  loginButtonLabel: "Se connecter avec SSO",
  cookiePrefix: "generic_admin",
  aiSiteDescription: "a French website",
  locales: genericLocales,
  routes: genericRoutes,
  pageHeaders: genericPageHeaders,
  adminNav,
  settingsNav,
  homePage: {
    eyebrow: "Site administrable",
    title: "Pilotez vos contenus depuis un admin commun.",
    subheading:
      "Cette base admin permet de gerer les contenus, medias, routes et traductions de votre site.",
    primaryCtaLabel: "Voir les contenus",
    secondaryCtaLabel: "Configurer le site",
    translations: [
      {
        locale: "fr",
        eyebrow: "Site administrable",
        title: "Pilotez vos contenus depuis un admin commun.",
        subheading:
          "Cette base admin permet de gerer les contenus, medias, routes et traductions de votre site.",
        primaryCtaLabel: "Voir les contenus",
        secondaryCtaLabel: "Configurer le site",
      },
      {
        locale: "en",
        eyebrow: "Managed website",
        title: "Manage your content from a shared admin.",
        subheading:
          "This admin base manages content, media, routes and translations for your website.",
        primaryCtaLabel: "View content",
        secondaryCtaLabel: "Configure site",
      },
    ],
  },
  footer: {
    tagline: "Administration de contenus pour site web.",
    contactHeading: "Contact",
    contactEmail: "contact@example.com",
    contactSocialLabel: "@example",
    legalText: "Tous droits reserves.",
    madeWithCare: "Fait avec soin",
    translations: [
      {
        locale: "fr",
        tagline: "Administration de contenus pour site web.",
        contactHeading: "Contact",
        contactEmail: "contact@example.com",
        contactSocialLabel: "@example",
        legalText: "Tous droits reserves.",
        madeWithCare: "Fait avec soin",
      },
      {
        locale: "en",
        tagline: "Content administration for websites.",
        contactHeading: "Contact",
        contactEmail: "contact@example.com",
        contactSocialLabel: "@example",
        legalText: "All rights reserved.",
        madeWithCare: "Made with care",
      },
    ],
  },
  studioPage: {
    eyebrow: "Equipe",
    title: "Presentez votre organisation.",
    intro:
      "Utilisez cette page pour decrire votre approche, votre equipe et votre histoire.",
    founderOneName: "Fondateur 1",
    founderOneRole: "Role",
    founderOneDescription: "Description du premier profil.",
    founderOneImageUrl: "",
    founderOneImageAlt: null,
    founderTwoName: "Fondateur 2",
    founderTwoRole: "Role",
    founderTwoDescription: "Description du second profil.",
    founderTwoImageUrl: "",
    founderTwoImageAlt: null,
    historyTitle: "Histoire",
    historyContentHtml:
      "<p>Remplacez ce texte par l'histoire et le positionnement du site.</p>",
  },
  indexNowProjectPaths: (slug) => [
    `/portfolio/${slug}`,
    `/en/portfolio/${slug}`,
    "/portfolio",
    "/en/portfolio",
  ],
};

const volanteProfile: SiteProfile = {
  ...genericProfile,
  key: "volante",
  appName: "Volante",
  adminTitle: "Admin Panel",
  adminDescription: "Portail client Volante",
  loginSubtitle: "Portail client Volante",
  loginButtonLabel: "Se connecter avec Volante SSO",
  cookiePrefix: "volante",
  aiSiteDescription: "a French creative studio website",
  routes: genericRoutes.map((route) =>
    route.id === "trailblaze"
      ? {
          ...route,
          label: "Trailblaze",
          slug: "trailblaze",
          translations: { en: { label: "Trailblaze", slug: "trailblaze" } },
        }
      : route.id === "studio"
        ? {
            ...route,
            label: "Studio",
            slug: "studio",
            translations: { en: { label: "Studio", slug: "studio" } },
          }
        : route,
  ),
  pageHeaders: [
    {
      id: "studio",
      label: "Studio",
      eyebrow: "Qui sommes-nous",
      title: "Un studio indépendant, une vision singulière.",
      intro: null,
      dedicatedAdmin: true,
    },
    {
      id: "services",
      label: "Services",
      eyebrow: "Notre expertise",
      title: "Des services pensés pour faire rayonner votre marque.",
      intro: null,
    },
    {
      id: "portfolio",
      label: "Portfolio",
      eyebrow: "Nos réalisations",
      title: "Des projets construits avec exigence.",
      intro: null,
    },
    {
      id: "contact",
      label: "Contact",
      eyebrow: "Nous contacter",
      title: "Parlons de votre projet.",
      intro: null,
    },
  ],
  adminNav: adminNav.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.id === "studio-values") return { ...item, label: "Valeurs Studio" };
      if (item.id === "trailblaze") return { ...item, label: "Trailblaze" };
      if (item.id === "page-studio") return { ...item, label: "Studio" };
      return item;
    }),
  })),
  homePage: {
    eyebrow: "Agence de communication créative",
    title: "Nous donnons vie aux idées qui méritent d'exister.",
    subheading:
      "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
    primaryCtaLabel: "Voir nos projets",
    secondaryCtaLabel: "Travailler ensemble",
    translations: [
      {
        locale: "fr",
        eyebrow: "Agence de communication créative",
        title: "Nous donnons vie aux idées qui méritent d'exister.",
        subheading:
          "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
        primaryCtaLabel: "Voir nos projets",
        secondaryCtaLabel: "Travailler ensemble",
      },
      {
        locale: "en",
        eyebrow: "Creative communication agency",
        title: "We bring ideas worth sharing to life.",
        subheading:
          "Studio Volante helps ambitious brands shape their communication — visual identity, content strategy and art direction.",
        primaryCtaLabel: "View our work",
        secondaryCtaLabel: "Work with us",
      },
    ],
  },
  footer: {
    tagline:
      "Agence de communication créative. Nous donnons vie aux idées qui comptent.",
    contactHeading: "Contact",
    contactEmail: "yasmine@studio-volante.fr",
    contactSocialLabel: "@vlnt.studio",
    legalText: "Studio Volante. Tous droits réservés.",
    madeWithCare: "Fait avec soin à Paris",
    translations: [
      {
        locale: "fr",
        tagline:
          "Agence de communication créative. Nous donnons vie aux idées qui comptent.",
        contactHeading: "Contact",
        contactEmail: "yasmine@studio-volante.fr",
        contactSocialLabel: "@vlnt.studio",
        legalText: "Studio Volante. Tous droits réservés.",
        madeWithCare: "Fait avec soin à Paris",
      },
      {
        locale: "en",
        tagline:
          "Creative communication agency. We bring meaningful ideas to life.",
        contactHeading: "Contact",
        contactEmail: "yasmine@studio-volante.fr",
        contactSocialLabel: "@vlnt.studio",
        legalText: "Studio Volante. All rights reserved.",
        madeWithCare: "Made with care in Paris",
      },
    ],
  },
  studioPage: {
    eyebrow: "Les fondateurs",
    title: "Deux regards, une même vision créative.",
    intro:
      "Studio Volante est né de la rencontre de deux parcours complémentaires, unis par l'exigence du beau et la conviction que chaque marque a une histoire unique à raconter.",
    founderOneName: "William Romano",
    founderOneRole: "Co-fondateur",
    founderOneDescription:
      "Stratège de marque et directeur artistique, William conçoit des univers visuels justes, durables et porteurs de sens. Il accompagne les marques dans la définition de leur identité et de leur direction créative.",
    founderOneImageUrl: "",
    founderOneImageAlt: "Portrait de William Romano",
    founderTwoName: "Yasmine De Wilde",
    founderTwoRole: "Co-fondatrice",
    founderTwoDescription:
      "Experte en stratégie de contenu et communication, Yasmine donne voix aux marques avec clarté et émotion. Elle structure les messages pour créer des récits authentiques et impactants.",
    founderTwoImageUrl: "",
    founderTwoImageAlt: "Portrait de Yasmine De Wilde",
    historyTitle: "Notre histoire",
    historyContentHtml:
      "<p>Studio Volante est né de la conviction que la communication doit être aussi bien pensée qu'elle est belle. Fondé par des créatifs passionnés, le studio accompagne des marques de toutes tailles dans la construction d'une identité forte et cohérente.</p><p>Notre approche est toujours stratégique avant d'être esthétique : comprendre le positionnement, les cibles, les ambitions — puis créer.</p>",
  },
};

const profiles = {
  generic: genericProfile,
  volante: volanteProfile,
} satisfies Record<string, SiteProfile>;

export type SiteProfileKey = keyof typeof profiles;

const normalizeProfileKey = (value: string | undefined): SiteProfileKey => {
  const key = value?.trim().toLowerCase();
  return key && key in profiles ? (key as SiteProfileKey) : "generic";
};

export const getSiteProfile = () => profiles[normalizeProfileKey(process.env.SITE_PROFILE)];

export const siteProfiles = profiles;
