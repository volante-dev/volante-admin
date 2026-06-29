import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import prisma from "@/lib/prisma";
import { getPageHeaderContent } from "@/lib/page-header-content";
import { PageHeaderForm } from "@/components/admin/PageHeaderForm";
import { StudioPageForm } from "@/components/admin/StudioPageForm";
import type { StudioPageContentData } from "@/components/admin/studio-page-types";
import { getSiteLocales } from "@/lib/site-locales";

export const dynamic = "force-dynamic";

const defaultStudioPageContent: StudioPageContentData = {
  id: "studio",
  eyebrow: "Les fondateurs",
  title: "Deux regards, une même vision créative.",
  intro:
    "Studio Volante est né de la rencontre de deux parcours complémentaires, unis par l'exigence du beau et la conviction que chaque marque a une histoire unique à raconter.",
  founderOneName: "William Romano",
  founderOneRole: "Co-fondateur",
  founderOneDescription:
    "Stratège de marque et directeur artistique, William conçoit des univers visuels justes, durables et porteurs de sens. Il accompagne les marques dans la définition de leur identité et de leur direction créative.",
  founderOneImageUrl: "",
  founderOneImageAssetId: null,
  founderOneImageAlt: "Portrait de William Romano",
  founderTwoName: "Yasmine De Wilde",
  founderTwoRole: "Co-fondatrice",
  founderTwoDescription:
    "Experte en stratégie de contenu et communication, Yasmine donne voix aux marques avec clarté et émotion. Elle structure les messages pour créer des récits authentiques et impactants.",
  founderTwoImageUrl: "",
  founderTwoImageAssetId: null,
  founderTwoImageAlt: "Portrait de Yasmine De Wilde",
  historyTitle: "Notre histoire",
  historyContentHtml:
    "<p>Studio Volante est né de la conviction que la communication doit être aussi bien pensée qu'elle est belle. Fondé par des créatifs passionnés, le studio accompagne des marques de toutes tailles dans la construction d'une identité forte et cohérente.</p><p>Notre approche est toujours stratégique avant d'être esthétique : comprendre le positionnement, les cibles, les ambitions — puis créer.</p>",
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
