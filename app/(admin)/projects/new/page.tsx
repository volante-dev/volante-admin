import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { getProjectTaxonomyOptions } from "@/lib/project-taxonomies";
import { getSiteLocales } from "@/lib/site-locales";

const NewProjectPage = async () => {
  const [taxonomyOptions, locales] = await Promise.all([
    getProjectTaxonomyOptions(),
    getSiteLocales(),
  ]);
  return <>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
      <Link href="/projects">
        <Button startIcon={<ArrowBackIcon />} size="small">
          Realisations
        </Button>
      </Link>
    </Box>
    <Typography variant="h2" sx={{ mb: 3 }}>
      Nouvelle realisation
    </Typography>
    <ProjectForm
      taxonomyOptions={taxonomyOptions}
      locales={locales.filter((locale) => locale.enabledInAdmin)}
    />
  </>
};

export default NewProjectPage;
