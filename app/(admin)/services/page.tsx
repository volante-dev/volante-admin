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
  description: string;
  descriptionHtml: string;
  icon: string | null;
  order: number;
  active: boolean;
  translations: {
    locale: string;
    title: string | null;
    description: string | null;
    descriptionHtml: string | null;
  }[];
};

const ServicesPage = async () => {
  const raw = await prisma.service.findMany({
    orderBy: { order: "asc" },
    include: { translations: true },
  });

  const services: ServiceData[] = raw.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      descriptionHtml: s.descriptionHtml,
      icon: s.icon,
      order: s.order,
      active: s.active,
      translations: s.translations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        description: translation.description,
        descriptionHtml: translation.descriptionHtml,
      })),
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
        <Link href="/services/new">
          <Button variant="contained" startIcon={<AddIcon />}>
            Nouveau service
          </Button>
        </Link>
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
          <Link href="/services/new">
            <Button variant="outlined" startIcon={<AddIcon />}>
              Creer le premier service
            </Button>
          </Link>
        </Box>
      ) : (
        <ServiceTable services={services} />
      )}
    </>
  );
};

export default ServicesPage;
