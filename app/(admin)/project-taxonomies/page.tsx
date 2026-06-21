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
    active: entry.active,
    usageCount:
      entry._count.sectorProjects +
      entry._count.locationProjects +
      entry._count.deliveredServiceProjects,
  }));

  return <ProjectTaxonomyManager entries={rows} />;
};

export default ProjectTaxonomiesPage;
