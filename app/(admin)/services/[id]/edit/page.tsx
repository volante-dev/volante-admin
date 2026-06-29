import { notFound } from "next/navigation";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { ServicePortfolioExampleProject } from "@/components/admin/ServiceForm";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getSiteLocales } from "@/lib/site-locales";

export const dynamic = "force-dynamic";

const mapProjectOption = (project: {
  id: string;
  title: string;
  imageUrl: string;
  imageAsset: { mediaType: "IMAGE" | "VIDEO"; posterUrl: string | null } | null;
}): ServicePortfolioExampleProject => ({
  id: project.id,
  title: project.title,
  imageUrl: project.imageUrl,
  imageAssetMediaType: project.imageAsset?.mediaType ?? null,
  imageAssetPosterUrl: project.imageAsset?.posterUrl ?? null,
});

const EditServicePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const [raw, publishedProjects, locales] = await Promise.all([
    prisma.service.findUnique({
      where: { id },
      include: {
        portfolioExamples: {
          orderBy: { order: "asc" },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                imageAsset: { select: { mediaType: true, posterUrl: true } },
              },
            },
          },
        },
        translations: true,
      },
    }),
    prisma.project.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ portfolioOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        imageAsset: { select: { mediaType: true, posterUrl: true } },
      },
    }),
    getSiteLocales(),
  ]);
  if (!raw) notFound();

  const service = {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    icon: raw.icon,
    order: raw.order,
    active: raw.active,
    translations: raw.translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title,
      description: translation.description,
      descriptionHtml: translation.descriptionHtml,
    })),
    portfolioExamples: raw.portfolioExamples.map((example) =>
      mapProjectOption(example.project),
    ),
  };
  const availableProjects = publishedProjects.map(mapProjectOption);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Link href="/services">
          <Button startIcon={<ArrowBackIcon />} size="small">
            Services
          </Button>
        </Link>
      </Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Modifier : {service.title}
      </Typography>
      <ServiceForm
        service={service}
        availableProjects={availableProjects}
        locales={locales.filter((locale) => locale.enabledInAdmin)}
      />
    </>
  );
};

export default EditServicePage;
