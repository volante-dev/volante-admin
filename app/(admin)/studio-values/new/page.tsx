import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { StudioValueForm } from "@/components/admin/StudioValueForm";

const NewStudioValuePage = () => (
  <>
    <Box sx={{ mb: 3 }}>
      <Button
        component={Link}
        href="/studio-values"
        startIcon={<ArrowBackIcon />}
        size="small"
      >
        Valeurs Studio
      </Button>
    </Box>
    <Typography variant="h2" sx={{ mb: 3 }}>
      Nouvelle valeur
    </Typography>
    <StudioValueForm />
  </>
);

export default NewStudioValuePage;
