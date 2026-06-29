ALTER TABLE "ProjectTaxonomyEntry"
ADD COLUMN "slug" TEXT,
ADD COLUMN "icon" TEXT;

WITH sector_slugs AS (
  SELECT
    "id",
    COALESCE(
      NULLIF("normalizedKey", ''),
      "id"
    ) AS base_slug
  FROM "ProjectTaxonomyEntry"
  WHERE "type" = 'SECTOR'
),
ranked_sector_slugs AS (
  SELECT
    "id",
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY "id") AS slug_rank
  FROM sector_slugs
)
UPDATE "ProjectTaxonomyEntry" entry
SET
  "slug" = CASE
    WHEN ranked.slug_rank = 1 THEN ranked.base_slug
    ELSE ranked.base_slug || '-' || ranked.slug_rank::TEXT
  END,
  "icon" = COALESCE(entry."icon", 'category')
FROM ranked_sector_slugs ranked
WHERE entry."id" = ranked."id";

CREATE UNIQUE INDEX "ProjectTaxonomyEntry_type_slug_key"
ON "ProjectTaxonomyEntry"("type", "slug");
