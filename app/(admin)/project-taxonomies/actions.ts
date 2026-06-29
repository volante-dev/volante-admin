"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import {
  projectTaxonomyIconOptions,
  type ProjectTaxonomyOption,
  type ProjectTaxonomyType,
} from "@/components/admin/project-taxonomy-types";

type TaxonomyResult = {
  success: boolean;
  error?: string;
  entry?: ProjectTaxonomyOption;
};

const TYPES = new Set<ProjectTaxonomyType>([
  "SECTOR",
  "LOCATION",
  "DELIVERED_SERVICE",
]);
const ICONS = new Set<string>(projectTaxonomyIconOptions.map((option) => option.value));

const normalizeSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeNullableText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const parseEntry = (
  type: ProjectTaxonomyType,
  labelValue: string,
  labelEnValue: string,
  slugValue?: string | null,
  iconValue?: string | null,
  introEyebrowValue?: string | null,
  introEyebrowEnValue?: string | null,
  introTitleValue?: string | null,
  introTitleEnValue?: string | null,
  introValue?: string | null,
  introEnValue?: string | null,
) => {
  const label = labelValue.trim();
  const labelEn = labelEnValue.trim();
  const normalizedKey = normalizeSlug(label);
  const slug = type === "SECTOR" ? normalizeSlug(slugValue || label) : null;
  const icon = type === "SECTOR" && ICONS.has(iconValue ?? "")
    ? iconValue
    : type === "SECTOR"
      ? "category"
      : null;
  const introEyebrow = type === "SECTOR" ? normalizeNullableText(introEyebrowValue) : null;
  const introEyebrowEn = type === "SECTOR" ? normalizeNullableText(introEyebrowEnValue) : null;
  const introTitle = type === "SECTOR" ? normalizeNullableText(introTitleValue) : null;
  const introTitleEn = type === "SECTOR" ? normalizeNullableText(introTitleEnValue) : null;
  const intro = type === "SECTOR" ? normalizeNullableText(introValue) : null;
  const introEn = type === "SECTOR" ? normalizeNullableText(introEnValue) : null;
  if (!TYPES.has(type)) return { error: "Type de taxonomie invalide." } as const;
  if (label.length < 2) return { error: "Le libellé français est obligatoire." } as const;
  if (labelEn.length < 2) return { error: "La traduction anglaise est obligatoire." } as const;
  if (type === "SECTOR" && !slug) return { error: "Le slug du secteur est invalide." } as const;

  if (!normalizedKey) return { error: "Le libellé français est invalide." } as const;
  return {
    data: {
      type,
      label,
      labelEn,
      normalizedKey,
      slug,
      icon,
      introEyebrow,
      introEyebrowEn,
      introTitle,
      introTitleEn,
      intro,
      introEn,
    },
  } as const;
};

const actionError = (error: unknown): TaxonomyResult => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return { success: false, error: "Cette entrée existe déjà dans cette catégorie." };
  }
  return { success: false, error: "Une erreur est survenue." };
};

type ParsedEntryData = Extract<ReturnType<typeof parseEntry>, { data: unknown }>["data"];

const taxonomyTranslations = (entryId: string, data: ParsedEntryData) => [
  {
    entryId,
    locale: "fr",
    label: data.label,
    slug: data.slug,
    introEyebrow: data.introEyebrow,
    introTitle: data.introTitle,
    intro: data.intro,
  },
  {
    entryId,
    locale: "en",
    label: data.labelEn,
    slug: data.slug,
    introEyebrow: data.introEyebrowEn,
    introTitle: data.introTitleEn,
    intro: data.introEn,
  },
];

export const createProjectTaxonomyEntry = async (
  type: ProjectTaxonomyType,
  label: string,
  labelEn: string,
  slug?: string | null,
  icon?: string | null,
  introEyebrow?: string | null,
  introEyebrowEn?: string | null,
  introTitle?: string | null,
  introTitleEn?: string | null,
  intro?: string | null,
  introEn?: string | null,
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseEntry(
      type,
      label,
      labelEn,
      slug,
      icon,
      introEyebrow,
      introEyebrowEn,
      introTitle,
      introTitleEn,
      intro,
      introEn,
    );
    if ("error" in parsed) return { success: false, error: parsed.error };

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.projectTaxonomyEntry.create({ data: parsed.data });
      await Promise.all(
        taxonomyTranslations(created.id, parsed.data).map((translation) =>
          tx.projectTaxonomyEntryTranslation.upsert({
            where: {
              entryId_locale: {
                entryId: created.id,
                locale: translation.locale,
              },
            },
            create: translation,
            update: {
              label: translation.label,
              slug: translation.slug,
              introEyebrow: translation.introEyebrow,
              introTitle: translation.introTitle,
              intro: translation.intro,
            },
          }),
        ),
      );
      return created;
    });
    revalidatePath("/project-taxonomies");
    revalidatePath("/projects/new");
    return { success: true, entry };
  } catch (error) {
    return actionError(error);
  }
};

export const updateProjectTaxonomyEntry = async (
  id: string,
  label: string,
  labelEn: string,
  slug?: string | null,
  icon?: string | null,
  introEyebrow?: string | null,
  introEyebrowEn?: string | null,
  introTitle?: string | null,
  introTitleEn?: string | null,
  intro?: string | null,
  introEn?: string | null,
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    const current = await prisma.projectTaxonomyEntry.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Entrée introuvable." };
    const parsed = parseEntry(
      current.type,
      label,
      labelEn,
      slug ?? current.slug,
      icon ?? current.icon,
      introEyebrow ?? current.introEyebrow,
      introEyebrowEn ?? current.introEyebrowEn,
      introTitle ?? current.introTitle,
      introTitleEn ?? current.introTitleEn,
      intro ?? current.intro,
      introEn ?? current.introEn,
    );
    if ("error" in parsed) return { success: false, error: parsed.error };

    const entry = await prisma.$transaction(async (tx) => {
      const updated = await tx.projectTaxonomyEntry.update({
        where: { id },
        data: {
          label: parsed.data.label,
          labelEn: parsed.data.labelEn,
          normalizedKey: parsed.data.normalizedKey,
          slug: parsed.data.slug,
          icon: parsed.data.icon,
          introEyebrow: parsed.data.introEyebrow,
          introEyebrowEn: parsed.data.introEyebrowEn,
          introTitle: parsed.data.introTitle,
          introTitleEn: parsed.data.introTitleEn,
          intro: parsed.data.intro,
          introEn: parsed.data.introEn,
        },
      });
      await Promise.all(
        taxonomyTranslations(id, parsed.data).map((translation) =>
          tx.projectTaxonomyEntryTranslation.upsert({
            where: {
              entryId_locale: {
                entryId: id,
                locale: translation.locale,
              },
            },
            create: translation,
            update: {
              label: translation.label,
              slug: translation.slug,
              introEyebrow: translation.introEyebrow,
              introTitle: translation.introTitle,
              intro: translation.intro,
            },
          }),
        ),
      );
      return updated;
    });
    revalidatePath("/project-taxonomies");
    revalidatePath("/projects");
    return { success: true, entry };
  } catch (error) {
    return actionError(error);
  }
};

export const toggleProjectTaxonomyEntry = async (
  id: string,
  active: boolean,
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    await prisma.projectTaxonomyEntry.update({ where: { id }, data: { active } });
    revalidatePath("/project-taxonomies");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};

export const deleteProjectTaxonomyEntry = async (
  id: string,
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    const entry = await prisma.projectTaxonomyEntry.findUnique({
      where: { id },
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
    if (!entry) return { success: false, error: "Entrée introuvable." };
    const usageCount =
      entry._count.sectorProjects +
      entry._count.locationProjects +
      entry._count.deliveredServiceProjects;
    if (usageCount > 0) {
      return {
        success: false,
        error: "Cette entrée est utilisée. Modifiez d’abord les réalisations associées.",
      };
    }

    await prisma.projectTaxonomyEntry.delete({ where: { id } });
    revalidatePath("/project-taxonomies");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
