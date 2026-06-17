import { notFound } from "next/navigation";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { ServiceForm } from "@/components/admin/ServiceForm";

export const dynamic = "force-dynamic";

const EditServicePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const raw = await prisma.service.findUnique({ where: { id } });
  if (!raw) notFound();

  const service = {
    id: raw.id,
    title: raw.title,
    titleEn: raw.titleEn,
    description: raw.description,
    descriptionEn: raw.descriptionEn,
    icon: raw.icon,
    order: raw.order,
    active: raw.active,
  };

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
      <ServiceForm service={service} />
    </>
  );
};

export default EditServicePage;
