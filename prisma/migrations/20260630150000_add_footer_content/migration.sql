CREATE TABLE "FooterContent" (
  "id" TEXT NOT NULL,
  "tagline" TEXT NOT NULL,
  "contactHeading" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "contactSocialLabel" TEXT NOT NULL,
  "legalText" TEXT NOT NULL,
  "madeWithCare" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FooterContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FooterContentTranslation" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "tagline" TEXT,
  "contactHeading" TEXT,
  "contactEmail" TEXT,
  "contactSocialLabel" TEXT,
  "legalText" TEXT,
  "madeWithCare" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FooterContentTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FooterContentTranslation_contentId_locale_key"
  ON "FooterContentTranslation"("contentId", "locale");

CREATE INDEX "FooterContentTranslation_locale_idx"
  ON "FooterContentTranslation"("locale");

ALTER TABLE "FooterContentTranslation"
  ADD CONSTRAINT "FooterContentTranslation_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "FooterContent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "FooterContent" (
  "id",
  "tagline",
  "contactHeading",
  "contactEmail",
  "contactSocialLabel",
  "legalText",
  "madeWithCare",
  "updatedAt"
)
VALUES (
  'footer',
  'Agence de communication créative. Nous donnons vie aux idées qui comptent.',
  'Contact',
  'yasmine@studio-volante.fr',
  '@vlnt.studio',
  'Studio Volante. Tous droits réservés.',
  'Fait avec soin à Paris',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "FooterContentTranslation" (
  "id",
  "contentId",
  "locale",
  "tagline",
  "contactHeading",
  "contactEmail",
  "contactSocialLabel",
  "legalText",
  "madeWithCare",
  "updatedAt"
)
VALUES
  (
    'footer-content-fr',
    'footer',
    'fr',
    'Agence de communication créative. Nous donnons vie aux idées qui comptent.',
    'Contact',
    'yasmine@studio-volante.fr',
    '@vlnt.studio',
    'Studio Volante. Tous droits réservés.',
    'Fait avec soin à Paris',
    CURRENT_TIMESTAMP
  ),
  (
    'footer-content-en',
    'footer',
    'en',
    'Creative communication agency. We bring meaningful ideas to life.',
    'Contact',
    'yasmine@studio-volante.fr',
    '@vlnt.studio',
    'Studio Volante. All rights reserved.',
    'Made with care in Paris',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("contentId", "locale") DO NOTHING;
