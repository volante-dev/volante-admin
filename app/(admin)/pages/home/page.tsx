import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HomePageForm } from "@/components/admin/HomePageForm";
import { getHomePageContent } from "@/lib/home-page-content";

export const dynamic = "force-dynamic";

const HomePageAdmin = async () => {
  const content = await getHomePageContent();

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Pages / Accueil
        </Typography>
        <Typography variant="h2">Accueil</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h3">Sections Accueil</Typography>
      </Box>
      <HomePageForm content={content} />
    </>
  );
};

export default HomePageAdmin;
