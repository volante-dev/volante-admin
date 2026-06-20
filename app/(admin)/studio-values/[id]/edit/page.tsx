import { notFound } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { StudioValueForm } from "@/components/admin/StudioValueForm";

export const dynamic = "force-dynamic";

const EditStudioValuePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const studioValue = await prisma.studioValue.findUnique({ where: { id } });
  if (!studioValue) notFound();

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Link href="/studio-values">
          <Button startIcon={<ArrowBackIcon />} size="small">
            Valeurs Studio
          </Button>
        </Link>
      </Box>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Modifier : {studioValue.title}
      </Typography>
      <StudioValueForm studioValue={studioValue} />
    </>
  );
};

export default EditStudioValuePage;
