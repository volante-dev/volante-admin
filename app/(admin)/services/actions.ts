"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
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

    const title = formData.get("title") as string;
    const titleEn = (formData.get("titleEn") as string) || null;
    const description = formData.get("description") as string;
    const descriptionEn = (formData.get("descriptionEn") as string) || null;
    const icon = (formData.get("icon") as string) || null;
    const order = parseInt(formData.get("order") as string, 10);
    const active = formData.get("active") === "true";

    if (!title || title.length < 2) {
      return { success: false, error: "Le titre doit contenir au moins 2 caracteres." };
    }
    if (!description || description.length < 10) {
      return {
        success: false,
        error: "La description doit contenir au moins 10 caracteres.",
      };
    }
    if (isNaN(order) || order < 0) {
      return { success: false, error: "L'ordre doit etre un nombre positif." };
    }

    const service = await prisma.service.create({
      data: { title, titleEn, description, descriptionEn, icon, order, active },
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

    const title = formData.get("title") as string;
    const titleEn = (formData.get("titleEn") as string) || null;
    const description = formData.get("description") as string;
    const descriptionEn = (formData.get("descriptionEn") as string) || null;
    const icon = (formData.get("icon") as string) || null;
    const order = parseInt(formData.get("order") as string, 10);
    const active = formData.get("active") === "true";

    if (!title || title.length < 2) {
      return { success: false, error: "Le titre doit contenir au moins 2 caracteres." };
    }
    if (!description || description.length < 10) {
      return {
        success: false,
        error: "La description doit contenir au moins 10 caracteres.",
      };
    }
    if (isNaN(order) || order < 0) {
      return { success: false, error: "L'ordre doit etre un nombre positif." };
    }

    await prisma.service.update({
      where: { id },
      data: { title, titleEn, description, descriptionEn, icon, order, active },
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
