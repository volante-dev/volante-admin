import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { ProjectForm } from "@/components/admin/ProjectForm";

const NewProjectPage = () => (
  <>
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
    <ProjectForm />
  </>
);

export default NewProjectPage;
