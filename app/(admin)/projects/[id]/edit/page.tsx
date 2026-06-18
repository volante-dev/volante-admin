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

export const dynamic = "force-dynamic";

const EditProjectPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const raw = await prisma.project.findUnique({
    where: { id },
    include: { slides: { orderBy: { order: "asc" } } },
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
    tags: raw.tags,
    featured: raw.featured,
    order: raw.order,
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
      posterUrl: slide.posterUrl,
      alt: slide.alt,
      altEn: slide.altEn,
    })),
    previewUrl: createProjectPreviewUrl(raw.slug, raw.publishedAt !== null),
  };

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
      <ProjectForm project={project} />
    </>
  );
};

export default EditProjectPage;
