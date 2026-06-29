import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HeaderNavigationForm } from "@/components/admin/HeaderNavigationForm";
import { getSiteRoutes } from "@/lib/site-routes";

export const dynamic = "force-dynamic";

const HeaderNavigationPage = async () => {
  const items = await getSiteRoutes();

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Configuration
        </Typography>
        <Typography variant="h2">Navigation du site</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
          Configure les intitulés, slugs publics et emplacements header/footer des
          routes principales. Les segments internes Next.js restent verrouillés.
        </Typography>
      </Box>
      <HeaderNavigationForm initialItems={items} />
    </>
  );
};

export default HeaderNavigationPage;
