import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HeaderNavigationForm } from "@/components/admin/HeaderNavigationForm";
import { getSiteRoutes } from "@/lib/site-routes";
import { getSiteLocales } from "@/lib/site-locales";

export const dynamic = "force-dynamic";

const HeaderNavigationPage = async () => {
  const [items, locales] = await Promise.all([getSiteRoutes(), getSiteLocales()]);

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
      <HeaderNavigationForm
        initialItems={items}
        locales={locales.filter((locale) => locale.enabledInAdmin)}
      />
    </>
  );
};

export default HeaderNavigationPage;
