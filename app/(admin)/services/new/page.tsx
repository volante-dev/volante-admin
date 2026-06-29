import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { ServicePortfolioExampleProject } from "@/components/admin/ServiceForm";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getSiteLocales } from "@/lib/site-locales";

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

const NewServicePage = async () => {
  const [publishedProjects, locales] = await Promise.all([
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
        Nouveau service
      </Typography>
      <ServiceForm
        availableProjects={publishedProjects.map(mapProjectOption)}
        locales={locales.filter((locale) => locale.enabledInAdmin)}
      />
    </>
  );
};

export default NewServicePage;
