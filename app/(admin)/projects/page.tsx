import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { createProjectPreviewUrl } from "@/lib/preview-token";
import { ProjectTable } from "@/components/admin/ProjectTable";
import { ProjectMasonryEditor } from "@/components/admin/ProjectMasonryEditor";
import { HeroColorBackfillButton } from "@/components/admin/HeroColorBackfillButton";
import type {
  AdminMasonryProject,
  AdminProjectListItem,
} from "@/components/admin/project-types";

export const dynamic = "force-dynamic";

const ProjectsPage = async () => {
  const raw = await prisma.project.findMany({
    orderBy: [
      { featured: "desc" },
      { order: "asc" },
      { publishedAt: "desc" },
    ],
    include: { _count: { select: { slides: true } } },
  });

  const projects: AdminProjectListItem[] = raw.map((project) => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    featured: project.featured,
    order: project.order,
    portfolioSize: project.portfolioSize,
    portfolioOrder: project.portfolioOrder,
    publishedAt: project.publishedAt?.toISOString() ?? null,
    slidesCount: project._count.slides,
    previewUrl: createProjectPreviewUrl(
      project.slug,
      project.publishedAt !== null,
    ),
  }));
  const masonryProjects: AdminMasonryProject[] = raw
    .filter((project) => project.publishedAt !== null)
    .sort(
      (a, b) =>
        a.portfolioOrder - b.portfolioOrder ||
        (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0) ||
        a.id.localeCompare(b.id),
    )
    .map((project) => ({
      id: project.id,
      title: project.title,
      slug: project.slug,
      imageUrl: project.imageUrl,
      portfolioSize: project.portfolioSize,
      portfolioOrder: project.portfolioOrder,
    }));

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h2">Realisations</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <HeroColorBackfillButton />
          <Link href="/projects/new">
            <Button variant="contained" startIcon={<AddIcon />}>
              Nouvelle realisation
            </Button>
          </Link>
        </Box>
      </Box>

      <ProjectMasonryEditor
        key={masonryProjects
          .map(
            (project) =>
              `${project.id}:${project.portfolioSize}:${project.portfolioOrder}`,
          )
          .join("|")}
        projects={masonryProjects}
      />

      {projects.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Aucune realisation pour le moment.
          </Typography>
          <Link href="/projects/new">
            <Button variant="outlined" startIcon={<AddIcon />}>
              Creer la premiere realisation
            </Button>
          </Link>
        </Box>
      ) : (
        <ProjectTable projects={projects} />
      )}
    </>
  );
};

export default ProjectsPage;
