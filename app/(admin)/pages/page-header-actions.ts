"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { normalizeNullable, normalizeRequired } from "@/lib/validation";
import { isPageHeaderId, type PageHeaderId } from "@/components/admin/page-header-types";

type ActionResult = {
  success: boolean;
  error?: string;
};

const actionError = (error: unknown): ActionResult => ({
  success: false,
  error: error instanceof Error ? error.message : "Une erreur est survenue.",
});

const parsePageHeaderContent = (formData: FormData) => {
  const values = {
    eyebrow: normalizeRequired(formData.get("eyebrow")),
    eyebrowEn: normalizeNullable(formData.get("eyebrowEn")),
    title: normalizeRequired(formData.get("title")),
    titleEn: normalizeNullable(formData.get("titleEn")),
  };

  if (values.eyebrow.length < 2) {
    return { error: "L'eyebrow est obligatoire." } as const;
  }
  if (values.title.length < 2) {
    return { error: "Le titre est obligatoire." } as const;
  }

  return { data: values } as const;
};

export const updatePageHeaderContent = async (
  pageId: PageHeaderId,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    if (!isPageHeaderId(pageId)) {
      return { success: false, error: "La page demandee est invalide." };
    }

    const parsed = parsePageHeaderContent(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.pageHeaderContent.upsert({
      where: { id: pageId },
      create: { id: pageId, ...parsed.data },
      update: parsed.data,
    });

    revalidatePath(`/pages/${pageId}`);
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
