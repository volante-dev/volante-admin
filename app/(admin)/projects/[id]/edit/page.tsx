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
      slides: { orderBy: { order: "asc" } },
      deliveredServiceEntries: { select: { id: true } },
    },
  });
  if (!raw) notFound();

  const project: AdminProjectDetail = {
    id: raw.id,
    title: raw.title,
    titleEn: raw.titleEn,
    slug: raw.slug,
    description: raw.description,
    descriptionEn: raw.descriptionEn,
    imageUrl: raw.imageUrl,
    imageAssetId: raw.imageAssetId,
    heroPaletteComputed: raw.heroPaletteComputed,
    tags: raw.tags,
    clientName: raw.clientName,
    sectorEntryId: raw.sectorEntryId,
    projectYear: raw.projectYear,
    locationEntryId: raw.locationEntryId,
    deliveredServiceEntryIds: raw.deliveredServiceEntries.map((entry) => entry.id),
    challenge: raw.challenge,
    challengeEn: raw.challengeEn,
    approach: raw.approach,
    approachEn: raw.approachEn,
    results: raw.results,
    resultsEn: raw.resultsEn,
    credits: raw.credits,
    awards: raw.awards,
    awardsEn: raw.awardsEn,
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
      titleEn: slide.titleEn,
      contentHtml: slide.contentHtml,
      contentHtmlEn: slide.contentHtmlEn,
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl,
      mediaAssetId: slide.mediaAssetId,
      posterUrl: slide.posterUrl,
      posterAssetId: slide.posterAssetId,
      alt: slide.alt,
      altEn: slide.altEn,
    })),
    previewUrl: createProjectPreviewUrl(raw.slug, raw.publishedAt !== null),
  };
  const taxonomyOptions = await getProjectTaxonomyOptions([
    raw.sectorEntryId,
    raw.locationEntryId,
    ...project.deliveredServiceEntryIds,
  ].filter((id): id is string => Boolean(id)));

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
      <ProjectForm project={project} taxonomyOptions={taxonomyOptions} />
    </>
  );
};

export default EditProjectPage;
