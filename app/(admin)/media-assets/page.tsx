import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import prisma from "@/lib/prisma";
import { MediaAssetTable } from "@/components/admin/media/MediaAssetTable";
import type { MediaAssetData } from "@/components/admin/media/media-types";

export const dynamic = "force-dynamic";

const getUsageCount = async (asset: { id: string; url: string }) => {
  const [
    projectImages,
    slideMedia,
    legacySlidePosters,
    studioFounderOneImages,
    studioFounderTwoImages,
    testimonialAvatars,
  ] = await Promise.all([
    prisma.project.count({
      where: { OR: [{ imageAssetId: asset.id }, { imageUrl: asset.url }] },
    }),
    prisma.projectSlide.count({
      where: { OR: [{ mediaAssetId: asset.id }, { mediaUrl: asset.url }] },
    }),
    prisma.projectSlide.count({ where: { posterUrl: asset.url } }),
    prisma.studioPageContent.count({
      where: {
        OR: [
          { founderOneImageAssetId: asset.id },
          { founderOneImageUrl: asset.url },
        ],
      },
    }),
    prisma.studioPageContent.count({
      where: {
        OR: [
          { founderTwoImageAssetId: asset.id },
          { founderTwoImageUrl: asset.url },
        ],
      },
    }),
    prisma.testimonial.count({
      where: { OR: [{ avatarAssetId: asset.id }, { avatarUrl: asset.url }] },
    }),
  ]);

  return (
    projectImages +
    slideMedia +
    legacySlidePosters +
    studioFounderOneImages +
    studioFounderTwoImages +
    testimonialAvatars
  );
};

const MediaAssetsPage = async () => {
  const rawAssets = await prisma.mediaAsset.findMany({
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    take: 300,
  });

  const assets: MediaAssetData[] = await Promise.all(
    rawAssets.map(async (asset) => ({
      id: asset.id,
      url: asset.url,
      pathname: asset.pathname,
      mediaType: asset.mediaType,
      mimeType: asset.mimeType,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      posterUrl: asset.posterUrl,
      posterPathname: asset.posterPathname,
      posterMimeType: asset.posterMimeType,
      posterSize: asset.posterSize,
      name: asset.name,
      alt: asset.alt,
      altEn: asset.altEn,
      tags: asset.tags,
      active: asset.active,
      createdAt: asset.createdAt.toISOString(),
      usageCount: await getUsageCount(asset),
    })),
  );

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2">Galerie de medias</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Images et videos disponibles pour les contenus du site.
        </Typography>
      </Box>
      <MediaAssetTable assets={assets} />
    </>
  );
};

export default MediaAssetsPage;
