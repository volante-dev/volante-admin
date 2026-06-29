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

type PageHeaderContentValues = {
  eyebrow: string;
  eyebrowEn: string | null;
  title: string;
  titleEn: string | null;
  intro: string | null;
  introEn: string | null;
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
    intro: normalizeNullable(formData.get("intro")),
    introEn: normalizeNullable(formData.get("introEn")),
  };

  if (values.eyebrow.length < 2) {
    return { error: "L'eyebrow est obligatoire." } as const;
  }
  if (values.title.length < 2) {
    return { error: "Le titre est obligatoire." } as const;
  }

  return { data: values } as const;
};

const pageHeaderTranslations = (
  contentId: string,
  data: PageHeaderContentValues,
) => [
  {
    contentId,
    locale: "fr",
    eyebrow: data.eyebrow,
    title: data.title,
    intro: data.intro,
  },
  {
    contentId,
    locale: "en",
    eyebrow: data.eyebrowEn,
    title: data.titleEn,
    intro: data.introEn,
  },
];

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

    await prisma.$transaction([
      prisma.pageHeaderContent.upsert({
        where: { id: pageId },
        create: { id: pageId, ...parsed.data },
        update: parsed.data,
      }),
      ...pageHeaderTranslations(pageId, parsed.data).map((translation) =>
        prisma.pageHeaderContentTranslation.upsert({
          where: {
            contentId_locale: {
              contentId: translation.contentId,
              locale: translation.locale,
            },
          },
          create: translation,
          update: {
            eyebrow: translation.eyebrow,
            title: translation.title,
            intro: translation.intro,
          },
        }),
      ),
    ]);

    revalidatePath(`/pages/${pageId}`);
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
};
