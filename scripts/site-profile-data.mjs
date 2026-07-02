const locales = [
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

const genericRoutes = [
  ["home", "Accueil", "", 0, false, false, true, 1, "weekly", { en: ["Home", ""] }],
  ["services", "Services", "services", 1, true, true, true, 0.8, "monthly", { en: ["Services", "services"] }],
  ["portfolio", "Portfolio", "portfolio", 2, true, true, true, 0.9, "monthly", { en: ["Portfolio", "portfolio"] }],
  ["trailblaze", "Articles", "articles", 3, true, true, true, 0.7, "monthly", { en: ["Articles", "articles"] }],
  ["studio", "A propos", "a-propos", 4, true, true, true, 0.7, "monthly", { en: ["About", "about"] }],
  ["contact", "Contact", "contact", 5, true, true, true, 0.6, "monthly", { en: ["Contact", "contact"] }],
];

const genericPageHeaders = [
  ["studio", "A propos", "Une equipe, une approche, une histoire.", null],
  ["services", "Expertise", "Des services adaptes a vos objectifs.", null],
  ["portfolio", "Realisations", "Des projets construits avec exigence.", null],
  ["contact", "Contact", "Parlons de votre projet.", null],
];

const genericProfile = {
  locales,
  routes: genericRoutes,
  pageHeaders: genericPageHeaders,
  homePage: {
    eyebrow: "Site administrable",
    title: "Pilotez vos contenus depuis un admin commun.",
    subheading:
      "Cette base admin permet de gerer les contenus, medias, routes et traductions de votre site.",
    primaryCtaLabel: "Voir les contenus",
    secondaryCtaLabel: "Configurer le site",
    translations: [
      [
        "fr",
        "Site administrable",
        "Pilotez vos contenus depuis un admin commun.",
        "Cette base admin permet de gerer les contenus, medias, routes et traductions de votre site.",
        "Voir les contenus",
        "Configurer le site",
      ],
      [
        "en",
        "Managed website",
        "Manage your content from a shared admin.",
        "This admin base manages content, media, routes and translations for your website.",
        "View content",
        "Configure site",
      ],
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
      [
        "fr",
        "Administration de contenus pour site web.",
        "Contact",
        "contact@example.com",
        "@example",
        "Tous droits reserves.",
        "Fait avec soin",
      ],
      [
        "en",
        "Content administration for websites.",
        "Contact",
        "contact@example.com",
        "@example",
        "All rights reserved.",
        "Made with care",
      ],
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
};

const volanteProfile = {
  ...genericProfile,
  routes: genericRoutes.map((route) => {
    if (route[0] === "trailblaze") {
      return ["trailblaze", "Trailblaze", "trailblaze", 3, true, true, true, 0.7, "monthly", { en: ["Trailblaze", "trailblaze"] }];
    }
    if (route[0] === "studio") {
      return ["studio", "Studio", "studio", 4, true, true, true, 0.7, "monthly", { en: ["Studio", "studio"] }];
    }
    return route;
  }),
  pageHeaders: [
    ["studio", "Qui sommes-nous", "Un studio indépendant, une vision singulière.", null],
    ["services", "Notre expertise", "Des services pensés pour faire rayonner votre marque.", null],
    ["portfolio", "Nos réalisations", "Des projets construits avec exigence.", null],
    ["contact", "Nous contacter", "Parlons de votre projet.", null],
  ],
  homePage: {
    eyebrow: "Agence de communication créative",
    title: "Nous donnons vie aux idées qui méritent d'exister.",
    subheading:
      "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
    primaryCtaLabel: "Voir nos projets",
    secondaryCtaLabel: "Travailler ensemble",
    translations: [
      [
        "fr",
        "Agence de communication créative",
        "Nous donnons vie aux idées qui méritent d'exister.",
        "Studio Volante accompagne les marques ambitieuses dans leur communication — identité visuelle, stratégie de contenu, direction artistique.",
        "Voir nos projets",
        "Travailler ensemble",
      ],
      [
        "en",
        "Creative communication agency",
        "We bring ideas worth sharing to life.",
        "Studio Volante helps ambitious brands shape their communication — visual identity, content strategy and art direction.",
        "View our work",
        "Work with us",
      ],
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
      [
        "fr",
        "Agence de communication créative. Nous donnons vie aux idées qui comptent.",
        "Contact",
        "yasmine@studio-volante.fr",
        "@vlnt.studio",
        "Studio Volante. Tous droits réservés.",
        "Fait avec soin à Paris",
      ],
      [
        "en",
        "Creative communication agency. We bring meaningful ideas to life.",
        "Contact",
        "yasmine@studio-volante.fr",
        "@vlnt.studio",
        "Studio Volante. All rights reserved.",
        "Made with care in Paris",
      ],
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

export const getSeedProfile = () => {
  const key = process.env.SITE_PROFILE?.trim().toLowerCase();
  return key === "volante" ? volanteProfile : genericProfile;
};
