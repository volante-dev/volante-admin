import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getPageHeaderContent } from "@/lib/page-header-content";
import { PageHeaderForm } from "@/components/admin/PageHeaderForm";
import { getSiteLocales } from "@/lib/site-locales";
import {
  isPageHeaderId,
  pageHeaderLabels,
  type PageHeaderId,
} from "@/components/admin/page-header-types";

export const dynamic = "force-dynamic";

const pageIdsWithDedicatedAdmin = new Set<PageHeaderId>(["studio"]);

const PageAdmin = async ({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) => {
  const { pageId: rawPageId } = await params;
  if (!isPageHeaderId(rawPageId) || pageIdsWithDedicatedAdmin.has(rawPageId)) {
    notFound();
  }

  const [content, locales] = await Promise.all([
    getPageHeaderContent(rawPageId),
    getSiteLocales(),
  ]);
  const adminLocales = locales.filter((locale) => locale.enabledInAdmin);
  const label = pageHeaderLabels[rawPageId];

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Pages / {label}
        </Typography>
        <Typography variant="h2">{label}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h3">Contenu de page</Typography>
      </Box>
      <PageHeaderForm content={content} locales={adminLocales} />
    </>
  );
};

export default PageAdmin;
