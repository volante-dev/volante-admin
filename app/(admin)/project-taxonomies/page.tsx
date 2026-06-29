import prisma from "@/lib/prisma";
import { ProjectTaxonomyManager } from "@/components/admin/ProjectTaxonomyManager";
import type { ProjectTaxonomyRow } from "@/components/admin/project-taxonomy-types";

export const dynamic = "force-dynamic";

const ProjectTaxonomiesPage = async () => {
  const entries = await prisma.projectTaxonomyEntry.findMany({
    orderBy: [{ type: "asc" }, { label: "asc" }],
    include: {
      _count: {
        select: {
          sectorProjects: true,
          locationProjects: true,
          deliveredServiceProjects: true,
        },
      },
    },
  });

  const rows: ProjectTaxonomyRow[] = entries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    label: entry.label,
    labelEn: entry.labelEn,
    slug: entry.slug,
    icon: entry.icon,
    introEyebrow: entry.introEyebrow,
    introEyebrowEn: entry.introEyebrowEn,
    introTitle: entry.introTitle,
    introTitleEn: entry.introTitleEn,
    intro: entry.intro,
    introEn: entry.introEn,
    active: entry.active,
    usageCount:
      entry._count.sectorProjects +
      entry._count.locationProjects +
      entry._count.deliveredServiceProjects,
  }));

  return <ProjectTaxonomyManager entries={rows} />;
};

export default ProjectTaxonomiesPage;
