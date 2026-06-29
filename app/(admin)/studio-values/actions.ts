"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

const parseStudioValue = (formData: FormData) => {
  const title = String(formData.get("title") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const descriptionEn =
    String(formData.get("descriptionEn") ?? "").trim() || null;
  const order = Number.parseInt(String(formData.get("order") ?? ""), 10);
  const active = formData.get("active") === "true";

  if (title.length < 2) {
    return { error: "Le titre doit contenir au moins 2 caracteres." } as const;
  }
  if (description.length < 10) {
    return {
      error: "La description doit contenir au moins 10 caracteres.",
    } as const;
  }
  if (!Number.isInteger(order) || order < 0) {
    return { error: "L'ordre doit etre un nombre positif." } as const;
  }

  return {
    data: { title, titleEn, description, descriptionEn, order, active },
  } as const;
};

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

type StudioValueData = {
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  order: number;
  active: boolean;
};

const studioValueTranslations = (studioValueId: string, data: StudioValueData) => [
  {
    studioValueId,
    locale: "fr",
    title: data.title,
    description: data.description,
  },
  {
    studioValueId,
    locale: "en",
    title: data.titleEn,
    description: data.descriptionEn,
  },
];

export const createStudioValue = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseStudioValue(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const studioValue = await prisma.$transaction(async (tx) => {
      const created = await tx.studioValue.create({ data: parsed.data });
      await Promise.all(
        studioValueTranslations(created.id, parsed.data).map((translation) =>
          tx.studioValueTranslation.upsert({
            where: {
              studioValueId_locale: {
                studioValueId: created.id,
                locale: translation.locale,
              },
            },
            create: translation,
            update: {
              title: translation.title,
              description: translation.description,
            },
          }),
        ),
      );
      return created;
    });
    revalidatePath("/studio-values");
    return { success: true, id: studioValue.id };
  } catch (error) {
    return actionError(error);
  }
};

export const updateStudioValue = async (
  id: string,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = parseStudioValue(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction([
      prisma.studioValue.update({ where: { id }, data: parsed.data }),
      ...studioValueTranslations(id, parsed.data).map((translation) =>
        prisma.studioValueTranslation.upsert({
          where: {
            studioValueId_locale: {
              studioValueId: id,
              locale: translation.locale,
            },
          },
          create: translation,
          update: {
            title: translation.title,
            description: translation.description,
          },
        }),
      ),
    ]);
    revalidatePath("/studio-values");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};

export const toggleStudioValueActive = async (
  id: string,
  active: boolean,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.studioValue.update({ where: { id }, data: { active } });
    revalidatePath("/studio-values");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};

export const deleteStudioValue = async (
  id: string,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.studioValue.delete({ where: { id } });
    revalidatePath("/studio-values");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};

export const reorderStudioValues = async (
  orderedIds: string[],
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.$transaction(
      orderedIds.map((id, order) =>
        prisma.studioValue.update({ where: { id }, data: { order } }),
      ),
    );
    revalidatePath("/studio-values");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
