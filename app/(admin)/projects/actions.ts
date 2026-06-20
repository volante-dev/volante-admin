"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { sanitizeRichTextHtml, isBlankRichText } from "@/lib/rich-text";
import {
  isValidMediaUrl,
  normalizeNullable,
  normalizeRequired,
  parseDateOrNull,
  parseNonNegativeInteger,
  parseTags,
} from "@/lib/validation";
import { notifyProjectIndexing } from "@/lib/search-indexing";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
  warnings?: string[];
};

type MasonryLayoutItem = {
  id: string;
  portfolioSize: "NORMAL" | "HERO";
};

type SlidePayload = {
  id?: string;
  title: string;
  titleEn?: string;
  contentHtml: string;
  contentHtmlEn?: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  posterUrl?: string;
  alt?: string;
  altEn?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseSlides = (formData: FormData): SlidePayload[] => {
  const raw = formData.get("slides");
  if (typeof raw !== "string" || !raw.trim()) return [];

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed.map((slide) => {
    const value = slide as Partial<SlidePayload>;
    return {
      id: typeof value.id === "string" && value.id ? value.id : undefined,
      title: typeof value.title === "string" ? value.title.trim() : "",
      titleEn:
        typeof value.titleEn === "string" ? value.titleEn.trim() : undefined,
      contentHtml:
        typeof value.contentHtml === "string" ? value.contentHtml : "",
      contentHtmlEn:
        typeof value.contentHtmlEn === "string"
          ? value.contentHtmlEn
          : undefined,
      mediaType: value.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
      mediaUrl: typeof value.mediaUrl === "string" ? value.mediaUrl.trim() : "",
      posterUrl:
        typeof value.posterUrl === "string" ? value.posterUrl.trim() : undefined,
      alt: typeof value.alt === "string" ? value.alt.trim() : undefined,
      altEn: typeof value.altEn === "string" ? value.altEn.trim() : undefined,
    };
  });
};

const validateProjectPayload = async (
  formData: FormData,
  currentId?: string,
) => {
  const title = normalizeRequired(formData.get("title"));
  const titleEn = normalizeNullable(formData.get("titleEn"));
  const slug = normalizeRequired(formData.get("slug"));
  const description = normalizeRequired(formData.get("description"));
  const descriptionEn = normalizeNullable(formData.get("descriptionEn"));
  const imageUrl = normalizeRequired(formData.get("imageUrl"));
  const tags = parseTags(formData.get("tags"));
  const clientName = normalizeNullable(formData.get("clientName"));
  const sector = normalizeNullable(formData.get("sector"));
  const sectorEn = normalizeNullable(formData.get("sectorEn"));
  const projectYearRaw = normalizeNullable(formData.get("projectYear"));
  const projectYear = projectYearRaw ? Number.parseInt(projectYearRaw, 10) : null;
  const projectLocation = normalizeNullable(formData.get("projectLocation"));
  const projectLocationEn = normalizeNullable(formData.get("projectLocationEn"));
  const deliveredServices = parseTags(formData.get("deliveredServices"));
  const deliveredServicesEn = parseTags(formData.get("deliveredServicesEn"));
  const challenge = normalizeNullable(formData.get("challenge"));
  const challengeEn = normalizeNullable(formData.get("challengeEn"));
  const approach = normalizeNullable(formData.get("approach"));
  const approachEn = normalizeNullable(formData.get("approachEn"));
  const results = normalizeNullable(formData.get("results"));
  const resultsEn = normalizeNullable(formData.get("resultsEn"));
  const credits = normalizeNullable(formData.get("credits"));
  const awards = normalizeNullable(formData.get("awards"));
  const awardsEn = normalizeNullable(formData.get("awardsEn"));
  const externalUrl = normalizeNullable(formData.get("externalUrl"));
  const featured = formData.get("featured") === "true";
  const order = parseNonNegativeInteger(formData.get("order"));
  const publishedAt = parseDateOrNull(formData.get("publishedAt"));
  const slides = parseSlides(formData);

  if (!title) return { error: "Le titre est obligatoire." };
  if (!slug) return { error: "Le slug est obligatoire." };
  if (!slugPattern.test(slug)) {
    return {
      error:
        "Le slug doit contenir uniquement des minuscules, chiffres et tirets.",
    };
  }
  if (!description) return { error: "La description est obligatoire." };
  if (!imageUrl) return { error: "L'image de couverture est obligatoire." };
  if (!isValidMediaUrl(imageUrl)) {
    return { error: "L'URL de couverture est invalide." };
  }
  if (order === null) {
    return { error: "L'ordre doit etre un nombre positif." };
  }
  if (publishedAt === undefined) {
    return { error: "La date de publication est invalide." };
  }
  if (
    projectYear !== null &&
    (!Number.isInteger(projectYear) || projectYear < 1900 || projectYear > 2100)
  ) {
    return { error: "L'annee du projet est invalide." };
  }
  if (externalUrl && !isValidMediaUrl(externalUrl)) {
    return { error: "Le lien externe est invalide." };
  }

  const existingSlug = await prisma.project.findUnique({ where: { slug } });
  if (existingSlug && existingSlug.id !== currentId) {
    return { error: "Ce slug est deja utilise." };
  }

  const warnings: string[] = [];
  const sanitizedSlides = slides.map((slide, index) => {
    const label = `Slide ${index + 1}`;
    if (!slide.title) throw new Error(`${label}: le titre est obligatoire.`);
    if (isBlankRichText(slide.contentHtml)) {
      throw new Error(`${label}: le contenu est obligatoire.`);
    }
    if (!["IMAGE", "VIDEO"].includes(slide.mediaType)) {
      throw new Error(`${label}: le type de media est invalide.`);
    }
    if (!slide.mediaUrl || !isValidMediaUrl(slide.mediaUrl)) {
      throw new Error(`${label}: l'URL media est obligatoire et valide.`);
    }
    if (slide.posterUrl && !isValidMediaUrl(slide.posterUrl)) {
      throw new Error(`${label}: l'URL poster est invalide.`);
    }
    if (slide.mediaType === "VIDEO" && !slide.posterUrl) {
      warnings.push(`${label}: poster conseille pour une video.`);
    }
    if (slide.mediaType === "IMAGE" && !slide.alt) {
      warnings.push(`${label}: texte alternatif conseille pour une image.`);
    }

    const contentHtml = sanitizeRichTextHtml(slide.contentHtml);
    const contentHtmlEn = slide.contentHtmlEn
      ? sanitizeRichTextHtml(slide.contentHtmlEn)
      : null;

    if (contentHtml !== slide.contentHtml || contentHtmlEn !== (slide.contentHtmlEn || null)) {
      warnings.push(`${label}: du HTML non supporte a ete nettoye.`);
    }

    return {
      id: slide.id,
      order: index,
      title: slide.title,
      titleEn: slide.titleEn || null,
      contentHtml,
      contentHtmlEn,
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl,
      posterUrl: slide.posterUrl || null,
      alt: slide.alt || null,
      altEn: slide.altEn || null,
    };
  });

  if (publishedAt && sanitizedSlides.length === 0) {
    warnings.push(
      "Aucune slide n'est renseignee. La page publique utilisera le fallback couverture + description.",
    );
  }

  return {
    data: {
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      imageUrl,
      tags,
      clientName,
      sector,
      sectorEn,
      projectYear,
      projectLocation,
      projectLocationEn,
      deliveredServices,
      deliveredServicesEn,
      challenge,
      challengeEn,
      approach,
      approachEn,
      results,
      resultsEn,
      credits,
      awards,
      awardsEn,
      externalUrl,
      featured,
      order,
      publishedAt,
      slides: sanitizedSlides,
    },
    warnings,
  };
};

const saveSlides = async (
  tx: Pick<typeof prisma, "projectSlide">,
  projectId: string,
  slides: NonNullable<
    Awaited<ReturnType<typeof validateProjectPayload>>["data"]
  >["slides"],
) => {
  const incomingIds = slides
    .map((slide) => slide.id)
    .filter((id): id is string => Boolean(id));

  await tx.projectSlide.deleteMany({
    where: {
      projectId,
      ...(incomingIds.length ? { id: { notIn: incomingIds } } : {}),
    },
  });

  for (const slide of slides) {
    const data = {
      order: slide.order,
      title: slide.title,
      titleEn: slide.titleEn,
      contentHtml: slide.contentHtml,
      contentHtmlEn: slide.contentHtmlEn,
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl,
      posterUrl: slide.posterUrl,
      alt: slide.alt,
      altEn: slide.altEn,
    };

    if (slide.id) {
      await tx.projectSlide.updateMany({
        where: { id: slide.id, projectId },
        data,
      });
    } else {
      await tx.projectSlide.create({
        data: {
          ...data,
          projectId,
        },
      });
    }
  }
};

export const createProject = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = await validateProjectPayload(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const project = await prisma.$transaction(async (tx) => {
      const portfolioOrder = parsed.data.publishedAt
        ? ((
            await tx.project.aggregate({
              where: { publishedAt: { not: null } },
              _max: { portfolioOrder: true },
            })
          )._max.portfolioOrder ?? -1) + 1
        : 0;
      const created = await tx.project.create({
        data: {
          title: parsed.data.title,
          titleEn: parsed.data.titleEn,
          slug: parsed.data.slug,
          description: parsed.data.description,
          descriptionEn: parsed.data.descriptionEn,
          imageUrl: parsed.data.imageUrl,
          tags: parsed.data.tags,
          clientName: parsed.data.clientName,
          sector: parsed.data.sector,
          sectorEn: parsed.data.sectorEn,
          projectYear: parsed.data.projectYear,
          projectLocation: parsed.data.projectLocation,
          projectLocationEn: parsed.data.projectLocationEn,
          deliveredServices: parsed.data.deliveredServices,
          deliveredServicesEn: parsed.data.deliveredServicesEn,
          challenge: parsed.data.challenge,
          challengeEn: parsed.data.challengeEn,
          approach: parsed.data.approach,
          approachEn: parsed.data.approachEn,
          results: parsed.data.results,
          resultsEn: parsed.data.resultsEn,
          credits: parsed.data.credits,
          awards: parsed.data.awards,
          awardsEn: parsed.data.awardsEn,
          externalUrl: parsed.data.externalUrl,
          featured: parsed.data.featured,
          order: parsed.data.order,
          portfolioOrder,
          portfolioSize: "NORMAL",
          publishedAt: parsed.data.publishedAt,
        },
      });
      await saveSlides(tx, created.id, parsed.data.slides);
      return created;
    });

    revalidatePath("/projects");
    if (project.publishedAt) await notifyProjectIndexing(project.slug);
    return { success: true, id: project.id, warnings: parsed.warnings };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const updateProject = async (
  id: string,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = await validateProjectPayload(formData, id);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction(async (tx) => {
      const current = await tx.project.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      if (!current) throw new Error("Projet introuvable.");

      const newlyPublished = !current.publishedAt && parsed.data.publishedAt;
      const portfolioOrder = newlyPublished
        ? ((
            await tx.project.aggregate({
              where: { publishedAt: { not: null } },
              _max: { portfolioOrder: true },
            })
          )._max.portfolioOrder ?? -1) + 1
        : undefined;
      await tx.project.update({
        where: { id },
        data: {
          title: parsed.data.title,
          titleEn: parsed.data.titleEn,
          slug: parsed.data.slug,
          description: parsed.data.description,
          descriptionEn: parsed.data.descriptionEn,
          imageUrl: parsed.data.imageUrl,
          tags: parsed.data.tags,
          clientName: parsed.data.clientName,
          sector: parsed.data.sector,
          sectorEn: parsed.data.sectorEn,
          projectYear: parsed.data.projectYear,
          projectLocation: parsed.data.projectLocation,
          projectLocationEn: parsed.data.projectLocationEn,
          deliveredServices: parsed.data.deliveredServices,
          deliveredServicesEn: parsed.data.deliveredServicesEn,
          challenge: parsed.data.challenge,
          challengeEn: parsed.data.challengeEn,
          approach: parsed.data.approach,
          approachEn: parsed.data.approachEn,
          results: parsed.data.results,
          resultsEn: parsed.data.resultsEn,
          credits: parsed.data.credits,
          awards: parsed.data.awards,
          awardsEn: parsed.data.awardsEn,
          externalUrl: parsed.data.externalUrl,
          featured: parsed.data.featured,
          order: parsed.data.order,
          ...(newlyPublished
            ? { portfolioOrder, portfolioSize: "NORMAL" as const }
            : {}),
          publishedAt: parsed.data.publishedAt,
        },
      });
      await saveSlides(tx, id, parsed.data.slides);
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}/edit`);
    if (parsed.data.publishedAt) await notifyProjectIndexing(parsed.data.slug);
    return { success: true, id, warnings: parsed.warnings };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const publishProject = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const project = await prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { slides: true } } },
    });
    if (!project) return { success: false, error: "Projet introuvable." };

    if (!project.title || !project.slug || !project.description || !project.imageUrl) {
      return {
        success: false,
        error:
          "Impossible de publier sans titre, slug, description et image de couverture.",
      };
    }
    if (!isValidMediaUrl(project.imageUrl)) {
      return { success: false, error: "L'URL de couverture est invalide." };
    }

    if (!project.publishedAt) {
      await prisma.$transaction(async (tx) => {
        const aggregate = await tx.project.aggregate({
          where: { publishedAt: { not: null } },
          _max: { portfolioOrder: true },
        });
        await tx.project.update({
          where: { id },
          data: {
            publishedAt: new Date(),
            portfolioOrder: (aggregate._max.portfolioOrder ?? -1) + 1,
            portfolioSize: "NORMAL",
          },
        });
      });
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}/edit`);
    await notifyProjectIndexing(project.slug);
    return {
      success: true,
      warnings:
        project._count.slides === 0
          ? [
              "Projet publie sans slide. La page publique utilisera le fallback couverture + description.",
            ]
          : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const unpublishProject = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const project = await prisma.project.update({
      where: { id },
      data: { publishedAt: null },
    });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}/edit`);
    await notifyProjectIndexing(project.slug);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const deleteProject = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const project = await prisma.project.delete({ where: { id } });
    revalidatePath("/projects");
    await notifyProjectIndexing(project.slug);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const updateProjectMasonryLayout = async (
  items: MasonryLayoutItem[],
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();

    if (!Array.isArray(items)) {
      return { success: false, error: "Agencement invalide." };
    }

    const ids = items.map((item) => item.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return { success: false, error: "Une realisation est presente plusieurs fois." };
    }

    if (
      items.some(
        (item) =>
          !item.id ||
          !["NORMAL", "HERO"].includes(item.portfolioSize),
      )
    ) {
      return { success: false, error: "Agencement invalide." };
    }

    const publishedProjects = await prisma.project.findMany({
      where: { publishedAt: { not: null } },
      select: { id: true },
    });
    const publishedIds = new Set(publishedProjects.map((project) => project.id));
    if (
      publishedProjects.length !== items.length ||
      ids.some((id) => !publishedIds.has(id))
    ) {
      return {
        success: false,
        error:
          "L’agencement doit contenir exactement les realisations publiees.",
      };
    }

    await prisma.$transaction(
      items.map((item, index) =>
        prisma.project.update({
          where: { id: item.id },
          data: {
            portfolioOrder: index,
            portfolioSize: item.portfolioSize,
          },
        }),
      ),
    );

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};
