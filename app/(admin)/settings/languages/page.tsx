import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SiteLocaleSettingsForm } from "@/components/admin/SiteLocaleSettingsForm";
import { getSiteLocales } from "@/lib/site-locales";

export const dynamic = "force-dynamic";

const LanguageSettingsPage = async () => {
  const locales = await getSiteLocales();

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Settings
        </Typography>
        <Typography variant="h2">Langues</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
          Active les langues disponibles dans l&apos;admin, leur publication sur le
          front et l&apos;usage de la traduction IA.
        </Typography>
      </Box>
      <SiteLocaleSettingsForm initialLocales={locales} />
    </>
  );
};

export default LanguageSettingsPage;
