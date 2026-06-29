DROP INDEX IF EXISTS "BlogPost_slugEn_key";

ALTER TABLE "Project"
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "descriptionEn",
  DROP COLUMN IF EXISTS "challengeEn",
  DROP COLUMN IF EXISTS "approachEn",
  DROP COLUMN IF EXISTS "resultsEn",
  DROP COLUMN IF EXISTS "awardsEn";

ALTER TABLE "BlogPost"
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "eyebrowEn",
  DROP COLUMN IF EXISTS "slugEn",
  DROP COLUMN IF EXISTS "seoDescriptionEn",
  DROP COLUMN IF EXISTS "tagsEn";

ALTER TABLE "SiteRoute"
  DROP COLUMN IF EXISTS "labelEn",
  DROP COLUMN IF EXISTS "slugEn";

ALTER TABLE "BlogPostBlock"
  DROP COLUMN IF EXISTS "contentHtmlEn";

ALTER TABLE "ProjectTaxonomyEntry"
  DROP COLUMN IF EXISTS "labelEn",
  DROP COLUMN IF EXISTS "introEyebrowEn",
  DROP COLUMN IF EXISTS "introTitleEn",
  DROP COLUMN IF EXISTS "introEn";

ALTER TABLE "ProjectSlide"
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "contentHtmlEn",
  DROP COLUMN IF EXISTS "altEn";

ALTER TABLE "Service"
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "descriptionEn",
  DROP COLUMN IF EXISTS "descriptionHtmlEn";

ALTER TABLE "StudioValue"
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "descriptionEn";

ALTER TABLE "StudioPageContent"
  DROP COLUMN IF EXISTS "eyebrowEn",
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "introEn",
  DROP COLUMN IF EXISTS "founderOneNameEn",
  DROP COLUMN IF EXISTS "founderOneRoleEn",
  DROP COLUMN IF EXISTS "founderOneDescriptionEn",
  DROP COLUMN IF EXISTS "founderOneImageAltEn",
  DROP COLUMN IF EXISTS "founderTwoNameEn",
  DROP COLUMN IF EXISTS "founderTwoRoleEn",
  DROP COLUMN IF EXISTS "founderTwoDescriptionEn",
  DROP COLUMN IF EXISTS "founderTwoImageAltEn",
  DROP COLUMN IF EXISTS "historyTitleEn",
  DROP COLUMN IF EXISTS "historyContentHtmlEn";

ALTER TABLE "PageHeaderContent"
  DROP COLUMN IF EXISTS "eyebrowEn",
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "introEn";

ALTER TABLE "HomePageContent"
  DROP COLUMN IF EXISTS "eyebrowEn",
  DROP COLUMN IF EXISTS "titleEn",
  DROP COLUMN IF EXISTS "subheadingEn",
  DROP COLUMN IF EXISTS "primaryCtaLabelEn",
  DROP COLUMN IF EXISTS "secondaryCtaLabelEn";

ALTER TABLE "MediaAsset"
  DROP COLUMN IF EXISTS "altEn";
