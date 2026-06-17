import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { ServiceForm } from "@/components/admin/ServiceForm";

const NewServicePage = () => (
  <>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
      <Link href="/services">
        <Button startIcon={<ArrowBackIcon />} size="small">
          Services
        </Button>
      </Link>
    </Box>
    <Typography variant="h2" sx={{ mb: 3 }}>
      Nouveau service
    </Typography>
    <ServiceForm />
  </>
);

export default NewServicePage;
