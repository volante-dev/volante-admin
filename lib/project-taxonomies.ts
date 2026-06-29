import prisma from "./prisma";
import type { ProjectTaxonomyOption } from "@/components/admin/project-taxonomy-types";

export const getProjectTaxonomyOptions = async (
  selectedIds: string[] = [],
): Promise<ProjectTaxonomyOption[]> => {
  const entries = await prisma.projectTaxonomyEntry.findMany({
    where: {
      OR: [{ active: true }, ...(selectedIds.length ? [{ id: { in: selectedIds } }] : [])],
    },
    include: { translations: true },
    orderBy: [{ type: "asc" }, { label: "asc" }],
  });

  return entries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      label: entry.label,
      slug: entry.slug,
      icon: entry.icon,
      introEyebrow: entry.introEyebrow,
      introTitle: entry.introTitle,
      intro: entry.intro,
      active: entry.active,
      translations: entry.translations.map((translation) => ({
        locale: translation.locale,
        label: translation.label,
        slug: translation.slug,
        introEyebrow: translation.introEyebrow,
        introTitle: translation.introTitle,
        intro: translation.intro,
      })),
    }));
};
