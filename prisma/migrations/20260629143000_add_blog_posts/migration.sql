-- CreateEnum
CREATE TYPE "BlogPostBlockType" AS ENUM ('RICHTEXT', 'IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "eyebrowEn" TEXT,
    "slug" TEXT NOT NULL,
    "slugEn" TEXT NOT NULL,
    "coverMediaUrl" TEXT NOT NULL,
    "coverMediaAssetId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostBlock" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "BlogPostBlockType" NOT NULL,
    "contentHtml" TEXT,
    "contentHtmlEn" TEXT,
    "mediaUrl" TEXT,
    "mediaAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPostBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slugEn_key" ON "BlogPost"("slugEn");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_createdAt_idx" ON "BlogPost"("publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "BlogPostBlock_postId_order_idx" ON "BlogPostBlock"("postId", "order");

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_coverMediaAssetId_fkey" FOREIGN KEY ("coverMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostBlock" ADD CONSTRAINT "BlogPostBlock_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostBlock" ADD CONSTRAINT "BlogPostBlock_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
