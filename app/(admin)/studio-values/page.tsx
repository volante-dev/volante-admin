import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { StudioValueTable } from "@/components/admin/StudioValueTable";
import type { StudioValueData } from "@/components/admin/studio-value-types";

export const dynamic = "force-dynamic";

const StudioValuesPage = async () => {
  const studioValues: StudioValueData[] = await prisma.studioValue.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });

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
        <Typography variant="h2">Valeurs Studio</Typography>
        <Link href="/studio-values/new">
          <Button variant="contained" startIcon={<AddIcon />}>
            Nouvelle valeur
          </Button>
        </Link>
      </Box>

      {studioValues.length > 0 ? (
        <StudioValueTable studioValues={studioValues} />
      ) : (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Aucune valeur Studio pour le moment.
          </Typography>
          <Link href="/studio-values/new">
            <Button variant="outlined">Creer la premiere valeur</Button>
          </Link>
        </Box>
      )}
    </>
  );
};

export default StudioValuesPage;
