import prisma from "@/lib/prisma";
import { ProjectTaxonomyManager } from "@/components/admin/ProjectTaxonomyManager";
import type { ProjectTaxonomyRow } from "@/components/admin/project-taxonomy-types";
import { getSiteLocales } from "@/lib/site-locales";

export const dynamic = "force-dynamic";

const ProjectTaxonomiesPage = async () => {
  const [entries, locales] = await Promise.all([
    prisma.projectTaxonomyEntry.findMany({
      orderBy: [{ type: "asc" }, { label: "asc" }],
      include: {
        translations: true,
        _count: {
          select: {
            sectorProjects: true,
            locationProjects: true,
            deliveredServiceProjects: true,
          },
        },
      },
    }),
    getSiteLocales(),
  ]);

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
    translations: entry.translations.map((translation) => ({
      locale: translation.locale,
      label: translation.label,
      slug: translation.slug,
      introEyebrow: translation.introEyebrow,
      introTitle: translation.introTitle,
      intro: translation.intro,
    })),
    usageCount:
      entry._count.sectorProjects +
      entry._count.locationProjects +
      entry._count.deliveredServiceProjects,
  }));

  return (
    <ProjectTaxonomyManager
      entries={rows}
      locales={locales.filter((locale) => locale.enabledInAdmin)}
    />
  );
};

export default ProjectTaxonomiesPage;
