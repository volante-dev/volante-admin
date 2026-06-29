import { notFound } from "next/navigation";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { createProjectPreviewUrl } from "@/lib/preview-token";
import { ProjectForm } from "@/components/admin/ProjectForm";
import type { AdminProjectDetail } from "@/components/admin/project-types";
import { getProjectTaxonomyOptions } from "@/lib/project-taxonomies";
import { getSiteLocales } from "@/lib/site-locales";

export const dynamic = "force-dynamic";

const EditProjectPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const raw = await prisma.project.findUnique({
    where: { id },
    include: {
      imageAsset: { select: { mediaType: true, posterUrl: true } },
      slides: {
        orderBy: { order: "asc" },
        include: { translations: true },
      },
      deliveredServiceEntries: { select: { id: true } },
      translations: true,
    },
  });
  if (!raw) notFound();

  const project: AdminProjectDetail = {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description,
    imageUrl: raw.imageUrl,
    imageAssetId: raw.imageAssetId,
    imageAssetMediaType: raw.imageAsset?.mediaType ?? null,
    imageAssetPosterUrl: raw.imageAsset?.posterUrl ?? null,
    heroPaletteComputed: raw.heroPaletteComputed,
    tags: raw.tags,
    clientName: raw.clientName,
    sectorEntryId: raw.sectorEntryId,
    projectYear: raw.projectYear,
    locationEntryId: raw.locationEntryId,
    deliveredServiceEntryIds: raw.deliveredServiceEntries.map((entry) => entry.id),
    challenge: raw.challenge,
    approach: raw.approach,
    results: raw.results,
    credits: raw.credits,
    awards: raw.awards,
    externalUrl: raw.externalUrl,
    featured: raw.featured,
    order: raw.order,
    portfolioSize: raw.portfolioSize,
    portfolioOrder: raw.portfolioOrder,
    publishedAt: raw.publishedAt?.toISOString() ?? null,
    slides: raw.slides.map((slide) => ({
        id: slide.id,
        order: slide.order,
        title: slide.title,
        contentHtml: slide.contentHtml,
        mediaType: slide.mediaType,
        mediaUrl: slide.mediaUrl,
        mediaAssetId: slide.mediaAssetId,
        posterUrl: slide.posterUrl,
        alt: slide.alt,
        translations: slide.translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title,
          contentHtml: translation.contentHtml,
          alt: translation.alt,
        })),
    })),
    previewUrl: createProjectPreviewUrl(raw.slug, raw.publishedAt !== null),
    translations: raw.translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title,
      slug: translation.slug,
      description: translation.description,
      challenge: translation.challenge,
      approach: translation.approach,
      results: translation.results,
      awards: translation.awards,
    })),
  };
  const [taxonomyOptions, locales] = await Promise.all([
    getProjectTaxonomyOptions([
      raw.sectorEntryId,
      raw.locationEntryId,
      ...project.deliveredServiceEntryIds,
    ].filter((id): id is string => Boolean(id))),
    getSiteLocales(),
  ]);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Link href="/projects">
          <Button startIcon={<ArrowBackIcon />} size="small">
            Realisations
          </Button>
        </Link>
      </Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Modifier : {project.title}
      </Typography>
      <ProjectForm
        project={project}
        taxonomyOptions={taxonomyOptions}
        locales={locales.filter((locale) => locale.enabledInAdmin)}
      />
    </>
  );
};

export default EditProjectPage;
