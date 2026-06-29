CREATE TABLE "SiteRoute" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "labelEn" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "slugEn" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "showInHeader" BOOLEAN NOT NULL DEFAULT true,
  "showInFooter" BOOLEAN NOT NULL DEFAULT true,
  "includeInSitemap" BOOLEAN NOT NULL DEFAULT true,
  "sitemapPriority" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "sitemapFrequency" TEXT NOT NULL DEFAULT 'monthly',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SiteRoute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteRoute_order_idx" ON "SiteRoute"("order");
CREATE INDEX "SiteRoute_showInHeader_order_idx" ON "SiteRoute"("showInHeader", "order");
CREATE INDEX "SiteRoute_showInFooter_order_idx" ON "SiteRoute"("showInFooter", "order");
CREATE INDEX "SiteRoute_includeInSitemap_order_idx" ON "SiteRoute"("includeInSitemap", "order");

INSERT INTO "SiteRoute"
  ("id", "label", "labelEn", "slug", "slugEn", "order", "showInHeader", "showInFooter", "includeInSitemap", "sitemapPriority", "sitemapFrequency", "updatedAt")
VALUES
  ('home', 'Accueil', 'Home', '', '', 0, false, false, true, 1, 'weekly', CURRENT_TIMESTAMP),
  ('services', 'Services', 'Services', 'services', 'services', 1, true, true, true, 0.8, 'monthly', CURRENT_TIMESTAMP),
  ('portfolio', 'Portfolio', 'Portfolio', 'portfolio', 'portfolio', 2, true, true, true, 0.9, 'monthly', CURRENT_TIMESTAMP),
  ('trailblaze', 'Trailblaze', 'Trailblaze', 'trailblaze', 'trailblaze', 3, true, true, true, 0.7, 'monthly', CURRENT_TIMESTAMP),
  ('studio', 'Studio', 'Studio', 'studio', 'studio', 4, true, true, true, 0.7, 'monthly', CURRENT_TIMESTAMP),
  ('contact', 'Contact', 'Contact', 'contact', 'contact', 5, true, true, true, 0.6, 'monthly', CURRENT_TIMESTAMP);
