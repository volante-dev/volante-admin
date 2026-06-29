import { notFound } from "next/navigation";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { createBlogPostPreviewUrl } from "@/lib/preview-token";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import type { AdminBlogPostDetail } from "@/components/admin/blog-types";

export const dynamic = "force-dynamic";

const EditBlogPostPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const raw = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      coverMediaAsset: { select: { mediaType: true, posterUrl: true } },
      blocks: {
        orderBy: { order: "asc" },
        include: { mediaAsset: { select: { posterUrl: true } } },
      },
    },
  });
  if (!raw) notFound();

  const post: AdminBlogPostDetail = {
    id: raw.id,
    title: raw.title,
    titleEn: raw.titleEn,
    eyebrow: raw.eyebrow,
    eyebrowEn: raw.eyebrowEn,
    slug: raw.slug,
    slugEn: raw.slugEn,
    seoDescription: raw.seoDescription,
    seoDescriptionEn: raw.seoDescriptionEn,
    coverMediaUrl: raw.coverMediaUrl,
    coverMediaAssetId: raw.coverMediaAssetId,
    coverMediaAssetType: raw.coverMediaAsset?.mediaType ?? null,
    coverMediaPosterUrl: raw.coverMediaAsset?.posterUrl ?? null,
    tags: raw.tags,
    tagsEn: raw.tagsEn,
    publishedAt: raw.publishedAt?.toISOString() ?? null,
    blocks: raw.blocks.map((block) => ({
      id: block.id,
      order: block.order,
      type: block.type,
      contentHtml: block.contentHtml,
      contentHtmlEn: block.contentHtmlEn,
      mediaUrl: block.mediaUrl,
      mediaAssetId: block.mediaAssetId,
      mediaAssetPosterUrl: block.mediaAsset?.posterUrl ?? null,
    })),
    previewUrl: createBlogPostPreviewUrl(raw.slug, raw.publishedAt !== null),
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Link href="/trailblaze">
          <Button startIcon={<ArrowBackIcon />} size="small">
            Trailblaze
          </Button>
        </Link>
      </Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Modifier : {post.title}
      </Typography>
      <BlogPostForm post={post} />
    </>
  );
};

export default EditBlogPostPage;
