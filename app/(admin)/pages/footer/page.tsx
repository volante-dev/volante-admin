import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FooterContentForm } from "@/components/admin/FooterContentForm";
import { getFooterContent } from "@/lib/footer-content";
import { getSiteLocales } from "@/lib/site-locales";

export const dynamic = "force-dynamic";

const FooterAdminPage = async () => {
  const [content, locales] = await Promise.all([
    getFooterContent(),
    getSiteLocales(),
  ]);
  const adminLocales = locales.filter((locale) => locale.enabledInAdmin);

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Pages / Footer
        </Typography>
        <Typography variant="h2">Footer</Typography>
      </Box>

      <FooterContentForm content={content} locales={adminLocales} />
    </>
  );
};

export default FooterAdminPage;
