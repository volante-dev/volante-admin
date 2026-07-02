import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import prisma from "@/lib/prisma";
import { getPageHeaderContent } from "@/lib/page-header-content";
import { PageHeaderForm } from "@/components/admin/PageHeaderForm";
import { StudioPageForm } from "@/components/admin/StudioPageForm";
import type { StudioPageContentData } from "@/components/admin/studio-page-types";
import { getSiteLocales } from "@/lib/site-locales";
import { getSiteProfile } from "@/lib/site-profile";

export const dynamic = "force-dynamic";

const defaultStudioPageContent: StudioPageContentData = {
  id: "studio",
  ...getSiteProfile().studioPage,
  founderOneImageAssetId: null,
  founderTwoImageAssetId: null,
  translations: [],
};

const getStudioPageContent = async (): Promise<StudioPageContentData> => {
  const content = await prisma.studioPageContent
    .findUnique({
      where: { id: "studio" },
      include: { translations: true },
    })
    .catch(() => null);

  if (!content) return defaultStudioPageContent;

  return {
    id: content.id,
    eyebrow: content.eyebrow,
    title: content.title,
    intro: content.intro,
    founderOneName: content.founderOneName,
    founderOneRole: content.founderOneRole,
    founderOneDescription: content.founderOneDescription,
    founderOneImageUrl: content.founderOneImageUrl,
    founderOneImageAssetId: content.founderOneImageAssetId,
    founderOneImageAlt: content.founderOneImageAlt,
    founderTwoName: content.founderTwoName,
    founderTwoRole: content.founderTwoRole,
    founderTwoDescription: content.founderTwoDescription,
    founderTwoImageUrl: content.founderTwoImageUrl,
    founderTwoImageAssetId: content.founderTwoImageAssetId,
    founderTwoImageAlt: content.founderTwoImageAlt,
    historyTitle: content.historyTitle,
    historyContentHtml: content.historyContentHtml,
    translations: content.translations.map((translation) => ({
      locale: translation.locale,
      eyebrow: translation.eyebrow,
      title: translation.title,
      intro: translation.intro,
      founderOneName: translation.founderOneName,
      founderOneRole: translation.founderOneRole,
      founderOneDescription: translation.founderOneDescription,
      founderOneImageAlt: translation.founderOneImageAlt,
      founderTwoName: translation.founderTwoName,
      founderTwoRole: translation.founderTwoRole,
      founderTwoDescription: translation.founderTwoDescription,
      founderTwoImageAlt: translation.founderTwoImageAlt,
      historyTitle: translation.historyTitle,
      historyContentHtml: translation.historyContentHtml,
    })),
  };
};

const StudioPageAdmin = async () => {
  const [pageContent, sectionContent, locales] = await Promise.all([
    getPageHeaderContent("studio"),
    getStudioPageContent(),
    getSiteLocales(),
  ]);
  const adminLocales = locales.filter((locale) => locale.enabledInAdmin);

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Pages / Studio
        </Typography>
        <Typography variant="h2">Studio</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Contenu de page
        </Typography>
        <PageHeaderForm content={pageContent} locales={adminLocales} />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h3">Sections Studio</Typography>
      </Box>
      <StudioPageForm content={sectionContent} locales={adminLocales} />
    </>
  );
};

export default StudioPageAdmin;
