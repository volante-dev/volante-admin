"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import type {
  ProjectTaxonomyOption,
  ProjectTaxonomyType,
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

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseEntry = (
  type: ProjectTaxonomyType,
  labelValue: string,
  labelEnValue: string,
) => {
  const label = labelValue.trim();
  const labelEn = labelEnValue.trim();
  if (!TYPES.has(type)) return { error: "Type de taxonomie invalide." } as const;
  if (label.length < 2) return { error: "Le libellé français est obligatoire." } as const;
  if (labelEn.length < 2) return { error: "La traduction anglaise est obligatoire." } as const;

  const normalizedKey = normalizeKey(label);
  if (!normalizedKey) return { error: "Le libellé français est invalide." } as const;
  return { data: { type, label, labelEn, normalizedKey } } as const;
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

export const createProjectTaxonomyEntry = async (
  type: ProjectTaxonomyType,
  label: string,
  labelEn: string,
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseEntry(type, label, labelEn);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const entry = await prisma.projectTaxonomyEntry.create({ data: parsed.data });
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
): Promise<TaxonomyResult> => {
  try {
    await requireCrmAccess();
    const current = await prisma.projectTaxonomyEntry.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Entrée introuvable." };
    const parsed = parseEntry(current.type, label, labelEn);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const entry = await prisma.projectTaxonomyEntry.update({
      where: { id },
      data: {
        label: parsed.data.label,
        labelEn: parsed.data.labelEn,
        normalizedKey: parsed.data.normalizedKey,
      },
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
