import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { StudioValueForm } from "@/components/admin/StudioValueForm";
import { getSiteLocales } from "@/lib/site-locales";

const NewStudioValuePage = async () => {
  const locales = await getSiteLocales();

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
        Nouvelle valeur
      </Typography>
      <StudioValueForm locales={locales.filter((locale) => locale.enabledInAdmin)} />
    </>
  );
};

export default NewStudioValuePage;
