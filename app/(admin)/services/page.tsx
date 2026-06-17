import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { ServiceTable } from "@/components/admin/ServiceTable";

export const dynamic = "force-dynamic";

export type ServiceData = {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  icon: string | null;
  order: number;
  active: boolean;
};

const ServicesPage = async () => {
  const raw = await prisma.service.findMany({
    orderBy: { order: "asc" },
  });

  const services: ServiceData[] = raw.map((s) => ({
    id: s.id,
    title: s.title,
    titleEn: s.titleEn,
    description: s.description,
    descriptionEn: s.descriptionEn,
    icon: s.icon,
    order: s.order,
    active: s.active,
  }));

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h2">Services</Typography>
        <Button
          component={Link}
          href="/services/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nouveau service
        </Button>
      </Box>

      {services.length === 0 ? (
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
            Aucun service pour le moment.
          </Typography>
          <Button
            component={Link}
            href="/services/new"
            variant="outlined"
            startIcon={<AddIcon />}
          >
            Creer le premier service
          </Button>
        </Box>
      ) : (
        <ServiceTable services={services} />
      )}
    </>
  );
};

export default ServicesPage;
