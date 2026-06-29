import prisma from "./prisma";
import type { ProjectTaxonomyOption } from "@/components/admin/project-taxonomy-types";

export const getProjectTaxonomyOptions = async (
  selectedIds: string[] = [],
): Promise<ProjectTaxonomyOption[]> =>
  prisma.projectTaxonomyEntry.findMany({
    where: {
      OR: [{ active: true }, ...(selectedIds.length ? [{ id: { in: selectedIds } }] : [])],
    },
    select: {
      id: true,
      type: true,
      label: true,
      labelEn: true,
      slug: true,
      icon: true,
      introEyebrow: true,
      introEyebrowEn: true,
      introTitle: true,
      introTitleEn: true,
      intro: true,
      introEn: true,
      active: true,
    },
    orderBy: [{ type: "asc" }, { label: "asc" }],
  });
