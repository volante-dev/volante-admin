"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import {
  isBlankRichText,
  richTextToPlainText,
  sanitizeRichTextHtml,
} from "@/lib/rich-text";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

const parseService = (formData: FormData) => {
  const title = String(formData.get("title") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim() || null;
  const descriptionHtml = String(formData.get("descriptionHtml") ?? "");
  const descriptionHtmlEn = String(formData.get("descriptionHtmlEn") ?? "");
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const order = parseInt(String(formData.get("order") ?? ""), 10);
  const active = formData.get("active") === "true";

  if (!title || title.length < 2) {
    return {
      error: "Le titre doit contenir au moins 2 caracteres.",
    } as const;
  }
  if (isBlankRichText(descriptionHtml)) {
    return {
      error: "La description doit contenir au moins 10 caracteres.",
    } as const;
  }
  if (isNaN(order) || order < 0) {
    return { error: "L'ordre doit etre un nombre positif." } as const;
  }

  const sanitizedDescriptionHtml = sanitizeRichTextHtml(descriptionHtml);
  const sanitizedDescriptionHtmlEn = isBlankRichText(descriptionHtmlEn)
    ? null
    : sanitizeRichTextHtml(descriptionHtmlEn);
  const description = richTextToPlainText(sanitizedDescriptionHtml);
  const descriptionEn = sanitizedDescriptionHtmlEn
    ? richTextToPlainText(sanitizedDescriptionHtmlEn)
    : null;

  if (description.length < 10) {
    return {
      error: "La description doit contenir au moins 10 caracteres.",
    } as const;
  }

  return {
    data: {
      title,
      titleEn,
      description,
      descriptionEn,
      descriptionHtml: sanitizedDescriptionHtml,
      descriptionHtmlEn: sanitizedDescriptionHtmlEn,
      icon,
      order,
      active,
    },
  } as const;
};

export const toggleServiceActive = async (
  id: string,
  active: boolean,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.service.update({
      where: { id },
      data: { active },
    });
    revalidatePath("/services");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Une erreur est survenue.",
    };
  }
};

export const createService = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();

    const parsed = parseService(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const service = await prisma.service.create({
      data: parsed.data,
    });

    revalidatePath("/services");
    return { success: true, id: service.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Une erreur est survenue.",
    };
  }
};

export const updateService = async (
  id: string,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();

    const parsed = parseService(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/services");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Une erreur est survenue.",
    };
  }
};

export const deleteService = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.service.delete({ where: { id } });
    revalidatePath("/services");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Une erreur est survenue.",
    };
  }
};

export const reorderServices = async (
  orderedIds: string[],
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.service.update({ where: { id }, data: { order: index } }),
      ),
    );
    revalidatePath("/services");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Une erreur est survenue.",
    };
  }
};
