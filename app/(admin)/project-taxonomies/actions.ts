"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import {
  projectTaxonomyIconOptions,
  type ProjectTaxonomyOption,
  type ProjectTaxonomyType,
} from "@/components/admin/project-taxonomy-types";
import {
  defaultSiteLocaleCode,
  mergeLocaleTextTranslations,
  type LocaleTextTranslations,
} from "@/lib/admin-translations";

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

type TaxonomyTranslationField =
  | "label"
  | "slug"
  | "introEyebrow"
  | "introTitle"
  | "intro";

const parseEntry = (
  type: ProjectTaxonomyType,
  labelValue: string,
  slugValue?: string | null,
  iconValue?: string | null,
  introEyebrowValue?: string | null,
  introTitleValue?: string | null,
  introValue?: string | null,
) => {
  const label = labelValue.trim();
  const normalizedKey = normalizeSlug(label);
  const slug = type === "SECTOR" ? normalizeSlug(slugValue || label) : null;
  const icon = type === "SECTOR" && ICONS.has(iconValue ?? "")
    ? iconValue
    : type === "SECTOR"
      ? "category"
      : null;
  const introEyebrow = type === "SECTOR" ? normalizeNullableText(introEyebrowValue) : null;
  const introTitle = type === "SECTOR" ? normalizeNullableText(introTitleValue) : null;
  const intro = type === "SECTOR" ? normalizeNullableText(introValue) : null;
  if (!TYPES.has(type)) return { error: "Type de taxonomie invalide." } as const;
  if (label.length < 2) return { error: "Le libellé français est obligatoire." } as const;
  if (type === "SECTOR" && !slug) return { error: "Le slug du secteur est invalide." } as const;

  if (!normalizedKey) return { error: "Le libellé français est invalide." } as const;
  return {
    data: {
      type,
      label,
      normalizedKey,
      slug,
      icon,
      introEyebrow,
      introTitle,
      intro,
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

const taxonomyEntryData = (data: ParsedEntryData) => ({
  type: data.type,
  label: data.label,
  normalizedKey: data.normalizedKey,
  slug: data.slug,
  icon: data.icon,
  introEyebrow: data.introEyebrow,
  introTitle: data.introTitle,
  intro: data.intro,
});

const toProjectTaxonomyOption = (entry: {
  id: string;
  type: ProjectTaxonomyType;
  label: string;
  slug: string | null;
  icon: string | null;
  introEyebrow: string | null;
  introTitle: string | null;
  intro: string | null;
  active: boolean;
  translations: {
    locale: string;
    label: string | null;
    slug: string | null;
    introEyebrow: string | null;
    introTitle: string | null;
    intro: string | null;
  }[];
}): ProjectTaxonomyOption => ({
    id: entry.id,
    type: entry.type,
    label: entry.label,
    slug: entry.slug,
    icon: entry.icon,
    introEyebrow: entry.introEyebrow,
    introTitle: entry.introTitle,
    intro: entry.intro,
    active: entry.active,
    translations: entry.translations,
  });

const taxonomyTranslationRows = (
  entryId: string,
  data: ParsedEntryData,
  translations: LocaleTextTranslations<TaxonomyTranslationField> = {},
) => {
  mergeLocaleTextTranslations(translations, defaultSiteLocaleCode, {
    label: data.label,
    slug: data.slug,
    introEyebrow: data.introEyebrow,
    introTitle: data.introTitle,
    intro: data.intro,
  });

  return Object.entries(translations).map(([locale, values]) => ({
    entryId,
    locale,
    label: values.label ?? null,
    slug: values.slug ?? null,
    introEyebrow: values.introEyebrow ?? null,
    introTitle: values.introTitle ?? null,
    intro: values.intro ?? null,
  }));
};

export const createProjectTaxonomyEntry = async (
  type: ProjectTaxonomyType,
  label: string,
  slug?: string | null,
  icon?: string | null,
  introEyebrow?: string | null,
  introTitle?: string | null,
  intro?: string | null,
  translations?: LocaleTextTranslations<TaxonomyTranslationField>,
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseEntry(
      type,
      label,
      slug,
      icon,
      introEyebrow,
      introTitle,
      intro,
    );
    if ("error" in parsed) return { success: false, error: parsed.error };

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.projectTaxonomyEntry.create({
        data: taxonomyEntryData(parsed.data),
      });
      await Promise.all(
        taxonomyTranslationRows(created.id, parsed.data, translations).map((translation) =>
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
      return tx.projectTaxonomyEntry.findUniqueOrThrow({
        where: { id: created.id },
        include: { translations: true },
      });
    });
    revalidatePath("/project-taxonomies");
    revalidatePath("/projects/new");
    return { success: true, entry: toProjectTaxonomyOption(entry) };
  } catch (error) {
    return actionError(error);
  }
};

export const updateProjectTaxonomyEntry = async (
  id: string,
  label: string,
  slug?: string | null,
  icon?: string | null,
  introEyebrow?: string | null,
  introTitle?: string | null,
  intro?: string | null,
  translations?: LocaleTextTranslations<TaxonomyTranslationField>,
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    const current = await prisma.projectTaxonomyEntry.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Entrée introuvable." };
    const parsed = parseEntry(
      current.type,
      label,
      slug ?? current.slug,
      icon ?? current.icon,
      introEyebrow ?? current.introEyebrow,
      introTitle ?? current.introTitle,
      intro ?? current.intro,
    );
    if ("error" in parsed) return { success: false, error: parsed.error };

    const entry = await prisma.$transaction(async (tx) => {
      const updated = await tx.projectTaxonomyEntry.update({
        where: { id },
        data: taxonomyEntryData(parsed.data),
      });
      await Promise.all(
        taxonomyTranslationRows(id, parsed.data, translations).map((translation) =>
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
      return tx.projectTaxonomyEntry.findUniqueOrThrow({
        where: { id: updated.id },
        include: { translations: true },
      });
    });
    revalidatePath("/project-taxonomies");
    revalidatePath("/projects");
    return { success: true, entry: toProjectTaxonomyOption(entry) };
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
