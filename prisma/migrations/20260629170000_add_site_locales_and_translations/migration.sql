CREATE TYPE "TranslationSource" AS ENUM ('MANUAL', 'AI');

CREATE TABLE "SiteLocale" (
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "nativeLabel" TEXT NOT NULL,
  "hreflang" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "enabledInAdmin" BOOLEAN NOT NULL DEFAULT true,
  "publishedOnFront" BOOLEAN NOT NULL DEFAULT false,
  "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteLocale_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "ProjectTranslation" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT,
  "slug" TEXT,
  "description" TEXT,
  "challenge" TEXT,
  "approach" TEXT,
  "results" TEXT,
  "awards" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPostTranslation" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT,
  "eyebrow" TEXT,
  "slug" TEXT,
  "seoDescription" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPostTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteRouteTranslation" (
  "id" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "label" TEXT,
  "slug" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteRouteTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPostBlockTranslation" (
  "id" TEXT NOT NULL,
  "blockId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "contentHtml" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPostBlockTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectTaxonomyEntryTranslation" (
  "id" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "label" TEXT,
  "slug" TEXT,
  "introEyebrow" TEXT,
  "introTitle" TEXT,
  "intro" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectTaxonomyEntryTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectSlideTranslation" (
  "id" TEXT NOT NULL,
  "slideId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT,
  "contentHtml" TEXT,
  "alt" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectSlideTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceTranslation" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "descriptionHtml" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudioValueTranslation" (
  "id" TEXT NOT NULL,
  "studioValueId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudioValueTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudioPageContentTranslation" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "eyebrow" TEXT,
  "title" TEXT,
  "intro" TEXT,
  "founderOneName" TEXT,
  "founderOneRole" TEXT,
  "founderOneDescription" TEXT,
  "founderOneImageAlt" TEXT,
  "founderTwoName" TEXT,
  "founderTwoRole" TEXT,
  "founderTwoDescription" TEXT,
  "founderTwoImageAlt" TEXT,
  "historyTitle" TEXT,
  "historyContentHtml" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudioPageContentTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PageHeaderContentTranslation" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "eyebrow" TEXT,
  "title" TEXT,
  "intro" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PageHeaderContentTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomePageContentTranslation" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "eyebrow" TEXT,
  "title" TEXT,
  "subheading" TEXT,
  "primaryCtaLabel" TEXT,
  "secondaryCtaLabel" TEXT,
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomePageContentTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAssetTranslation" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "alt" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source" "TranslationSource" NOT NULL DEFAULT 'MANUAL',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAssetTranslation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteLocale_enabledInAdmin_order_idx" ON "SiteLocale"("enabledInAdmin", "order");
CREATE INDEX "SiteLocale_publishedOnFront_order_idx" ON "SiteLocale"("publishedOnFront", "order");
CREATE INDEX "SiteLocale_isDefault_idx" ON "SiteLocale"("isDefault");

CREATE UNIQUE INDEX "ProjectTranslation_projectId_locale_key" ON "ProjectTranslation"("projectId", "locale");
CREATE UNIQUE INDEX "ProjectTranslation_locale_slug_key" ON "ProjectTranslation"("locale", "slug");
CREATE INDEX "ProjectTranslation_locale_idx" ON "ProjectTranslation"("locale");

CREATE UNIQUE INDEX "BlogPostTranslation_postId_locale_key" ON "BlogPostTranslation"("postId", "locale");
CREATE UNIQUE INDEX "BlogPostTranslation_locale_slug_key" ON "BlogPostTranslation"("locale", "slug");
CREATE INDEX "BlogPostTranslation_locale_idx" ON "BlogPostTranslation"("locale");

CREATE UNIQUE INDEX "SiteRouteTranslation_routeId_locale_key" ON "SiteRouteTranslation"("routeId", "locale");
CREATE UNIQUE INDEX "SiteRouteTranslation_locale_slug_key" ON "SiteRouteTranslation"("locale", "slug");
CREATE INDEX "SiteRouteTranslation_locale_idx" ON "SiteRouteTranslation"("locale");

CREATE UNIQUE INDEX "BlogPostBlockTranslation_blockId_locale_key" ON "BlogPostBlockTranslation"("blockId", "locale");
CREATE INDEX "BlogPostBlockTranslation_locale_idx" ON "BlogPostBlockTranslation"("locale");

CREATE UNIQUE INDEX "ProjectTaxonomyEntryTranslation_entryId_locale_key" ON "ProjectTaxonomyEntryTranslation"("entryId", "locale");
CREATE INDEX "ProjectTaxonomyEntryTranslation_locale_idx" ON "ProjectTaxonomyEntryTranslation"("locale");

CREATE UNIQUE INDEX "ProjectSlideTranslation_slideId_locale_key" ON "ProjectSlideTranslation"("slideId", "locale");
CREATE INDEX "ProjectSlideTranslation_locale_idx" ON "ProjectSlideTranslation"("locale");

CREATE UNIQUE INDEX "ServiceTranslation_serviceId_locale_key" ON "ServiceTranslation"("serviceId", "locale");
CREATE INDEX "ServiceTranslation_locale_idx" ON "ServiceTranslation"("locale");

CREATE UNIQUE INDEX "StudioValueTranslation_studioValueId_locale_key" ON "StudioValueTranslation"("studioValueId", "locale");
CREATE INDEX "StudioValueTranslation_locale_idx" ON "StudioValueTranslation"("locale");

CREATE UNIQUE INDEX "StudioPageContentTranslation_contentId_locale_key" ON "StudioPageContentTranslation"("contentId", "locale");
CREATE INDEX "StudioPageContentTranslation_locale_idx" ON "StudioPageContentTranslation"("locale");

CREATE UNIQUE INDEX "PageHeaderContentTranslation_contentId_locale_key" ON "PageHeaderContentTranslation"("contentId", "locale");
CREATE INDEX "PageHeaderContentTranslation_locale_idx" ON "PageHeaderContentTranslation"("locale");

CREATE UNIQUE INDEX "HomePageContentTranslation_contentId_locale_key" ON "HomePageContentTranslation"("contentId", "locale");
CREATE INDEX "HomePageContentTranslation_locale_idx" ON "HomePageContentTranslation"("locale");

CREATE UNIQUE INDEX "MediaAssetTranslation_assetId_locale_key" ON "MediaAssetTranslation"("assetId", "locale");
CREATE INDEX "MediaAssetTranslation_locale_idx" ON "MediaAssetTranslation"("locale");

ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostTranslation" ADD CONSTRAINT "BlogPostTranslation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteRouteTranslation" ADD CONSTRAINT "SiteRouteTranslation_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "SiteRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostBlockTranslation" ADD CONSTRAINT "BlogPostBlockTranslation_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "BlogPostBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaxonomyEntryTranslation" ADD CONSTRAINT "ProjectTaxonomyEntryTranslation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ProjectTaxonomyEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSlideTranslation" ADD CONSTRAINT "ProjectSlideTranslation_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "ProjectSlide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceTranslation" ADD CONSTRAINT "ServiceTranslation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudioValueTranslation" ADD CONSTRAINT "StudioValueTranslation_studioValueId_fkey" FOREIGN KEY ("studioValueId") REFERENCES "StudioValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudioPageContentTranslation" ADD CONSTRAINT "StudioPageContentTranslation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "StudioPageContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageHeaderContentTranslation" ADD CONSTRAINT "PageHeaderContentTranslation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "PageHeaderContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomePageContentTranslation" ADD CONSTRAINT "HomePageContentTranslation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "HomePageContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAssetTranslation" ADD CONSTRAINT "MediaAssetTranslation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SiteLocale" ("code", "label", "nativeLabel", "hreflang", "isDefault", "enabledInAdmin", "publishedOnFront", "aiEnabled", "order", "updatedAt")
VALUES
  ('fr', 'Français', 'Français', 'fr-FR', true, true, true, false, 0, CURRENT_TIMESTAMP),
  ('en', 'Anglais', 'English', 'en', false, true, true, true, 1, CURRENT_TIMESTAMP);

INSERT INTO "ProjectTranslation" ("id", "projectId", "locale", "title", "slug", "description", "challenge", "approach", "results", "awards", "updatedAt")
SELECT 'project-fr-' || "id", "id", 'fr', "title", "slug", "description", "challenge", "approach", "results", "awards", CURRENT_TIMESTAMP
FROM "Project";

INSERT INTO "ProjectTranslation" ("id", "projectId", "locale", "title", "description", "challenge", "approach", "results", "awards", "updatedAt")
SELECT 'project-en-' || "id", "id", 'en', "titleEn", "descriptionEn", "challengeEn", "approachEn", "resultsEn", "awardsEn", CURRENT_TIMESTAMP
FROM "Project"
WHERE "titleEn" IS NOT NULL
   OR "descriptionEn" IS NOT NULL
   OR "challengeEn" IS NOT NULL
   OR "approachEn" IS NOT NULL
   OR "resultsEn" IS NOT NULL
   OR "awardsEn" IS NOT NULL;

INSERT INTO "BlogPostTranslation" ("id", "postId", "locale", "title", "eyebrow", "slug", "seoDescription", "tags", "updatedAt")
SELECT 'blog-post-fr-' || "id", "id", 'fr', "title", "eyebrow", "slug", "seoDescription", "tags", CURRENT_TIMESTAMP
FROM "BlogPost";

INSERT INTO "BlogPostTranslation" ("id", "postId", "locale", "title", "eyebrow", "slug", "seoDescription", "tags", "updatedAt")
SELECT 'blog-post-en-' || "id", "id", 'en', "titleEn", "eyebrowEn", "slugEn", "seoDescriptionEn", "tagsEn", CURRENT_TIMESTAMP
FROM "BlogPost";

INSERT INTO "SiteRouteTranslation" ("id", "routeId", "locale", "label", "slug", "updatedAt")
SELECT 'site-route-fr-' || "id", "id", 'fr', "label", "slug", CURRENT_TIMESTAMP
FROM "SiteRoute";

INSERT INTO "SiteRouteTranslation" ("id", "routeId", "locale", "label", "slug", "updatedAt")
SELECT 'site-route-en-' || "id", "id", 'en', "labelEn", "slugEn", CURRENT_TIMESTAMP
FROM "SiteRoute";

INSERT INTO "BlogPostBlockTranslation" ("id", "blockId", "locale", "contentHtml", "updatedAt")
SELECT 'blog-block-fr-' || "id", "id", 'fr', "contentHtml", CURRENT_TIMESTAMP
FROM "BlogPostBlock"
WHERE "contentHtml" IS NOT NULL;

INSERT INTO "BlogPostBlockTranslation" ("id", "blockId", "locale", "contentHtml", "updatedAt")
SELECT 'blog-block-en-' || "id", "id", 'en', "contentHtmlEn", CURRENT_TIMESTAMP
FROM "BlogPostBlock"
WHERE "contentHtmlEn" IS NOT NULL;

INSERT INTO "ProjectTaxonomyEntryTranslation" ("id", "entryId", "locale", "label", "slug", "introEyebrow", "introTitle", "intro", "updatedAt")
SELECT 'taxonomy-fr-' || "id", "id", 'fr', "label", "slug", "introEyebrow", "introTitle", "intro", CURRENT_TIMESTAMP
FROM "ProjectTaxonomyEntry";

INSERT INTO "ProjectTaxonomyEntryTranslation" ("id", "entryId", "locale", "label", "slug", "introEyebrow", "introTitle", "intro", "updatedAt")
SELECT 'taxonomy-en-' || "id", "id", 'en', "labelEn", "slug", "introEyebrowEn", "introTitleEn", "introEn", CURRENT_TIMESTAMP
FROM "ProjectTaxonomyEntry";

INSERT INTO "ProjectSlideTranslation" ("id", "slideId", "locale", "title", "contentHtml", "alt", "updatedAt")
SELECT 'project-slide-fr-' || "id", "id", 'fr', "title", "contentHtml", "alt", CURRENT_TIMESTAMP
FROM "ProjectSlide";

INSERT INTO "ProjectSlideTranslation" ("id", "slideId", "locale", "title", "contentHtml", "alt", "updatedAt")
SELECT 'project-slide-en-' || "id", "id", 'en', "titleEn", "contentHtmlEn", "altEn", CURRENT_TIMESTAMP
FROM "ProjectSlide"
WHERE "titleEn" IS NOT NULL
   OR "contentHtmlEn" IS NOT NULL
   OR "altEn" IS NOT NULL;

INSERT INTO "ServiceTranslation" ("id", "serviceId", "locale", "title", "description", "descriptionHtml", "updatedAt")
SELECT 'service-fr-' || "id", "id", 'fr', "title", "description", "descriptionHtml", CURRENT_TIMESTAMP
FROM "Service";

INSERT INTO "ServiceTranslation" ("id", "serviceId", "locale", "title", "description", "descriptionHtml", "updatedAt")
SELECT 'service-en-' || "id", "id", 'en', "titleEn", "descriptionEn", "descriptionHtmlEn", CURRENT_TIMESTAMP
FROM "Service"
WHERE "titleEn" IS NOT NULL
   OR "descriptionEn" IS NOT NULL
   OR "descriptionHtmlEn" IS NOT NULL;

INSERT INTO "StudioValueTranslation" ("id", "studioValueId", "locale", "title", "description", "updatedAt")
SELECT 'studio-value-fr-' || "id", "id", 'fr', "title", "description", CURRENT_TIMESTAMP
FROM "StudioValue";

INSERT INTO "StudioValueTranslation" ("id", "studioValueId", "locale", "title", "description", "updatedAt")
SELECT 'studio-value-en-' || "id", "id", 'en', "titleEn", "descriptionEn", CURRENT_TIMESTAMP
FROM "StudioValue"
WHERE "titleEn" IS NOT NULL
   OR "descriptionEn" IS NOT NULL;

INSERT INTO "StudioPageContentTranslation" (
  "id", "contentId", "locale", "eyebrow", "title", "intro",
  "founderOneName", "founderOneRole", "founderOneDescription", "founderOneImageAlt",
  "founderTwoName", "founderTwoRole", "founderTwoDescription", "founderTwoImageAlt",
  "historyTitle", "historyContentHtml", "updatedAt"
)
SELECT
  'studio-page-fr-' || "id", "id", 'fr', "eyebrow", "title", "intro",
  "founderOneName", "founderOneRole", "founderOneDescription", "founderOneImageAlt",
  "founderTwoName", "founderTwoRole", "founderTwoDescription", "founderTwoImageAlt",
  "historyTitle", "historyContentHtml", CURRENT_TIMESTAMP
FROM "StudioPageContent";

INSERT INTO "StudioPageContentTranslation" (
  "id", "contentId", "locale", "eyebrow", "title", "intro",
  "founderOneName", "founderOneRole", "founderOneDescription", "founderOneImageAlt",
  "founderTwoName", "founderTwoRole", "founderTwoDescription", "founderTwoImageAlt",
  "historyTitle", "historyContentHtml", "updatedAt"
)
SELECT
  'studio-page-en-' || "id", "id", 'en', "eyebrowEn", "titleEn", "introEn",
  "founderOneNameEn", "founderOneRoleEn", "founderOneDescriptionEn", "founderOneImageAltEn",
  "founderTwoNameEn", "founderTwoRoleEn", "founderTwoDescriptionEn", "founderTwoImageAltEn",
  "historyTitleEn", "historyContentHtmlEn", CURRENT_TIMESTAMP
FROM "StudioPageContent";

INSERT INTO "PageHeaderContentTranslation" ("id", "contentId", "locale", "eyebrow", "title", "intro", "updatedAt")
SELECT 'page-header-fr-' || "id", "id", 'fr', "eyebrow", "title", "intro", CURRENT_TIMESTAMP
FROM "PageHeaderContent";

INSERT INTO "PageHeaderContentTranslation" ("id", "contentId", "locale", "eyebrow", "title", "intro", "updatedAt")
SELECT 'page-header-en-' || "id", "id", 'en', "eyebrowEn", "titleEn", "introEn", CURRENT_TIMESTAMP
FROM "PageHeaderContent";

INSERT INTO "HomePageContentTranslation" ("id", "contentId", "locale", "eyebrow", "title", "subheading", "primaryCtaLabel", "secondaryCtaLabel", "updatedAt")
SELECT 'home-page-fr-' || "id", "id", 'fr', "eyebrow", "title", "subheading", "primaryCtaLabel", "secondaryCtaLabel", CURRENT_TIMESTAMP
FROM "HomePageContent";

INSERT INTO "HomePageContentTranslation" ("id", "contentId", "locale", "eyebrow", "title", "subheading", "primaryCtaLabel", "secondaryCtaLabel", "updatedAt")
SELECT 'home-page-en-' || "id", "id", 'en', "eyebrowEn", "titleEn", "subheadingEn", "primaryCtaLabelEn", "secondaryCtaLabelEn", CURRENT_TIMESTAMP
FROM "HomePageContent";

INSERT INTO "MediaAssetTranslation" ("id", "assetId", "locale", "alt", "tags", "updatedAt")
SELECT 'media-asset-fr-' || "id", "id", 'fr', "alt", "tags", CURRENT_TIMESTAMP
FROM "MediaAsset";

INSERT INTO "MediaAssetTranslation" ("id", "assetId", "locale", "alt", "tags", "updatedAt")
SELECT 'media-asset-en-' || "id", "id", 'en', "altEn", ARRAY[]::TEXT[], CURRENT_TIMESTAMP
FROM "MediaAsset"
WHERE "altEn" IS NOT NULL;
