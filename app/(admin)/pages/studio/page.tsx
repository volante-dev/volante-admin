import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import prisma from "@/lib/prisma";
import { StudioPageForm } from "@/components/admin/StudioPageForm";
import type { StudioPageContentData } from "@/components/admin/studio-page-types";

export const dynamic = "force-dynamic";

const defaultStudioPageContent: StudioPageContentData = {
  id: "studio",
  eyebrow: "Les fondateurs",
  eyebrowEn: null,
  title: "Deux regards, une même vision créative.",
  titleEn: null,
  intro:
    "Studio Volante est né de la rencontre de deux parcours complémentaires, unis par l'exigence du beau et la conviction que chaque marque a une histoire unique à raconter.",
  introEn: null,
  founderOneName: "William Romano",
  founderOneNameEn: null,
  founderOneRole: "Co-fondateur",
  founderOneRoleEn: null,
  founderOneDescription:
    "Stratège de marque et directeur artistique, William conçoit des univers visuels justes, durables et porteurs de sens. Il accompagne les marques dans la définition de leur identité et de leur direction créative.",
  founderOneDescriptionEn: null,
  founderOneImageUrl: "",
  founderOneImageAlt: "Portrait de William Romano",
  founderOneImageAltEn: null,
  founderTwoName: "Yasmine De Wilde",
  founderTwoNameEn: null,
  founderTwoRole: "Co-fondatrice",
  founderTwoRoleEn: null,
  founderTwoDescription:
    "Experte en stratégie de contenu et communication, Yasmine donne voix aux marques avec clarté et émotion. Elle structure les messages pour créer des récits authentiques et impactants.",
  founderTwoDescriptionEn: null,
  founderTwoImageUrl: "",
  founderTwoImageAlt: "Portrait de Yasmine De Wilde",
  founderTwoImageAltEn: null,
  historyTitle: "Notre histoire",
  historyTitleEn: "Our story",
  historyContentHtml:
    "<p>Studio Volante est né de la conviction que la communication doit être aussi bien pensée qu'elle est belle. Fondé par des créatifs passionnés, le studio accompagne des marques de toutes tailles dans la construction d'une identité forte et cohérente.</p><p>Notre approche est toujours stratégique avant d'être esthétique : comprendre le positionnement, les cibles, les ambitions — puis créer.</p>",
  historyContentHtmlEn:
    "<p>Studio Volante was born from the belief that communication should be as thoughtful as it is beautiful. Founded by passionate creatives, the studio helps brands of every size build strong, consistent identities.</p><p>Our approach is always strategic before it is aesthetic: understand the positioning, audiences and ambitions — then create.</p>",
};

const getStudioPageContent = async (): Promise<StudioPageContentData> => {
  const content = await prisma.studioPageContent
    .findUnique({ where: { id: "studio" } })
    .catch(() => null);

  return content ?? defaultStudioPageContent;
};

const StudioPageAdmin = async () => {
  const content = await getStudioPageContent();

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Pages / Studio
        </Typography>
        <Typography variant="h2">Bloc fondateurs</Typography>
      </Box>
      <StudioPageForm content={content} />
    </>
  );
};

export default StudioPageAdmin;
