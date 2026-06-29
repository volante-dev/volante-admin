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

type ParsedServiceData = {
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  descriptionHtml: string;
  descriptionHtmlEn: string | null;
  icon: string | null;
  order: number;
  active: boolean;
  portfolioExampleProjectIds: string[];
};

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const parsePortfolioExampleProjectIds = (
  formData: FormData,
): ParseResult<string[]> => {
  const raw = String(formData.get("portfolioExampleProjectIds") ?? "[]");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "La liste des exemples de réalisations est invalide." };
  }

  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === "string")) {
    return { ok: false, error: "La liste des exemples de réalisations est invalide." };
  }

  const ids = parsed.map((value) => value.trim()).filter(Boolean);
  const uniqueIds = Array.from(new Set(ids));

  if (ids.length !== uniqueIds.length) {
    return { ok: false, error: "Une réalisation ne peut être sélectionnée qu'une seule fois." };
  }
  if (uniqueIds.length > 3) {
    return { ok: false, error: "Vous pouvez sélectionner au maximum 3 exemples." };
  }

  return { ok: true, data: uniqueIds };
};

const parseService = (formData: FormData): ParseResult<ParsedServiceData> => {
  const title = String(formData.get("title") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim() || null;
  const descriptionHtml = String(formData.get("descriptionHtml") ?? "");
  const descriptionHtmlEn = String(formData.get("descriptionHtmlEn") ?? "");
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const order = parseInt(String(formData.get("order") ?? ""), 10);
  const active = formData.get("active") === "true";

  if (!title || title.length < 2) {
    return {
      ok: false,
      error: "Le titre doit contenir au moins 2 caracteres.",
    };
  }
  if (isBlankRichText(descriptionHtml)) {
    return {
      ok: false,
      error: "La description doit contenir au moins 10 caracteres.",
    };
  }
  if (isNaN(order) || order < 0) {
    return { ok: false, error: "L'ordre doit etre un nombre positif." };
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
      ok: false,
      error: "La description doit contenir au moins 10 caracteres.",
    };
  }

  const parsedExampleIds = parsePortfolioExampleProjectIds(formData);
  if (!parsedExampleIds.ok) return { ok: false, error: parsedExampleIds.error };

  return {
    ok: true,
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
      portfolioExampleProjectIds: parsedExampleIds.data,
    },
  };
};

const validatePublishedProjectIds = async (projectIds: string[]) => {
  if (projectIds.length === 0) return { data: [] as string[] };

  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
      publishedAt: { not: null },
    },
    select: { id: true },
  });
  const validIds = new Set(projects.map((project) => project.id));

  if (projectIds.some((id) => !validIds.has(id))) {
    return {
      error: "Les exemples doivent être des réalisations publiées.",
    } as const;
  }

  return { data: projectIds } as const;
};

const serviceData = (data: ParsedServiceData) => {
  return {
    title: data.title,
    titleEn: data.titleEn,
    description: data.description,
    descriptionEn: data.descriptionEn,
    descriptionHtml: data.descriptionHtml,
    descriptionHtmlEn: data.descriptionHtmlEn,
    icon: data.icon,
    order: data.order,
    active: data.active,
  };
};

const serviceTranslations = (serviceId: string, data: ParsedServiceData) => [
  {
    serviceId,
    locale: "fr",
    title: data.title,
    description: data.description,
    descriptionHtml: data.descriptionHtml,
  },
  {
    serviceId,
    locale: "en",
    title: data.titleEn,
    description: data.descriptionEn,
    descriptionHtml: data.descriptionHtmlEn,
  },
];

type ServiceTranslationClient = Pick<typeof prisma, "serviceTranslation">;

const upsertServiceTranslations = (
  tx: ServiceTranslationClient,
  serviceId: string,
  data: ParsedServiceData,
) =>
  Promise.all(
    serviceTranslations(serviceId, data).map((translation) =>
      tx.serviceTranslation.upsert({
        where: {
          serviceId_locale: {
            serviceId,
            locale: translation.locale,
          },
        },
        create: translation,
        update: {
          title: translation.title,
          description: translation.description,
          descriptionHtml: translation.descriptionHtml,
        },
      }),
    ),
  );

const createPortfolioExamples = (serviceId: string, projectIds: string[]) =>
  projectIds.map((projectId, order) => ({
    serviceId,
    projectId,
    order,
  }));

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
    if (!parsed.ok) return { success: false, error: parsed.error };
    const validProjectIds = await validatePublishedProjectIds(
      parsed.data.portfolioExampleProjectIds,
    );
    if ("error" in validProjectIds) {
      return { success: false, error: validProjectIds.error };
    }

    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.service.create({
        data: {
          ...serviceData(parsed.data),
          portfolioExamples: {
            create: validProjectIds.data.map((projectId, order) => ({
              projectId,
              order,
            })),
          },
        },
      });
      await upsertServiceTranslations(tx, created.id, parsed.data);
      return created;
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
    if (!parsed.ok) return { success: false, error: parsed.error };
    const validProjectIds = await validatePublishedProjectIds(
      parsed.data.portfolioExampleProjectIds,
    );
    if ("error" in validProjectIds) {
      return { success: false, error: validProjectIds.error };
    }

    await prisma.$transaction(async (tx) => {
      await tx.service.update({
        where: { id },
        data: serviceData(parsed.data),
      });
      await upsertServiceTranslations(tx, id, parsed.data);
      await tx.servicePortfolioExample.deleteMany({ where: { serviceId: id } });
      if (validProjectIds.data.length > 0) {
        await tx.servicePortfolioExample.createMany({
          data: createPortfolioExamples(id, validProjectIds.data),
        });
      }
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
