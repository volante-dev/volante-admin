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

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Button
          component={Link}
          href="/services"
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          Services
        </Button>
      </Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Modifier : {service.title}
      </Typography>
      <ServiceForm service={service} />
    </>
  );
};

export default EditServicePage;
