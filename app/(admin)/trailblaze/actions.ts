"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { isBlankRichText, sanitizeRichTextHtml } from "@/lib/rich-text";
import {
  isValidMediaUrl,
  normalizeNullable,
  normalizeRequired,
  parseDateOrNull,
} from "@/lib/validation";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
  warnings?: string[];
};

type BlogBlockPayload = {
  id?: string;
  type: "RICHTEXT" | "IMAGE" | "VIDEO";
  contentHtml?: string;
  contentHtmlEn?: string;
  mediaUrl?: string;
  mediaAssetId?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const seoDescriptionMaxLength = 240;

const inferMediaTypeFromUrl = (value: string) =>
  /\.(mp4|mov|webm)(?:[?#].*)?$/i.test(value) ? "VIDEO" : "IMAGE";

const parseTags = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();

    return parsed
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.replace(/^#+/, "").trim())
      .filter((tag) => tag.length >= 2 && tag.length <= 48)
      .filter((tag) => {
        const key = tag.toLocaleLowerCase("fr-FR");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 18);
  } catch {
    return [];
  }
};

const parseBlocks = (formData: FormData): BlogBlockPayload[] => {
  const raw = formData.get("blocks");
  if (typeof raw !== "string" || !raw.trim()) return [];

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed.map((block) => {
    const value = block as Partial<BlogBlockPayload>;
    const type =
      value.type === "IMAGE" || value.type === "VIDEO" ? value.type : "RICHTEXT";

    return {
      id: typeof value.id === "string" && value.id ? value.id : undefined,
      type,
      contentHtml:
        typeof value.contentHtml === "string" ? value.contentHtml : undefined,
      contentHtmlEn:
        typeof value.contentHtmlEn === "string"
          ? value.contentHtmlEn
          : undefined,
      mediaUrl:
        typeof value.mediaUrl === "string" ? value.mediaUrl.trim() : undefined,
      mediaAssetId:
        typeof value.mediaAssetId === "string" && value.mediaAssetId
          ? value.mediaAssetId
          : undefined,
    };
  });
};

const validateBlogPostPayload = async (
  formData: FormData,
  currentId?: string,
) => {
  const title = normalizeRequired(formData.get("title"));
  const titleEn = normalizeRequired(formData.get("titleEn"));
  const eyebrow = normalizeRequired(formData.get("eyebrow"));
  const eyebrowEn = normalizeNullable(formData.get("eyebrowEn"));
  const slug = normalizeRequired(formData.get("slug"));
  const slugEn = normalizeRequired(formData.get("slugEn"));
  const seoDescription = normalizeNullable(formData.get("seoDescription"));
  const seoDescriptionEn = normalizeNullable(formData.get("seoDescriptionEn"));
  const coverMediaUrl = normalizeRequired(formData.get("coverMediaUrl"));
  const coverMediaAssetId = normalizeNullable(formData.get("coverMediaAssetId"));
  const tags = parseTags(formData.get("tags"));
  const tagsEn = parseTags(formData.get("tagsEn"));
  const publishedAt = parseDateOrNull(formData.get("publishedAt"));
  const blocks = parseBlocks(formData);

  if (!title) return { error: "Le titre est obligatoire." };
  if (!titleEn) return { error: "Le titre anglais est obligatoire." };
  if (!eyebrow) return { error: "L'eyebrow est obligatoire." };
  if (!slug || !slugPattern.test(slug)) {
    return {
      error:
        "Le slug francais doit contenir uniquement des minuscules, chiffres et tirets.",
    };
  }
  if (!slugEn || !slugPattern.test(slugEn)) {
    return {
      error:
        "Le slug anglais doit contenir uniquement des minuscules, chiffres et tirets.",
    };
  }
  if (seoDescription && seoDescription.length > seoDescriptionMaxLength) {
    return {
      error: `La description SEO francaise doit faire ${seoDescriptionMaxLength} caracteres maximum.`,
    };
  }
  if (seoDescriptionEn && seoDescriptionEn.length > seoDescriptionMaxLength) {
    return {
      error: `La description SEO anglaise doit faire ${seoDescriptionMaxLength} caracteres maximum.`,
    };
  }
  if (!coverMediaUrl || !isValidMediaUrl(coverMediaUrl)) {
    return { error: "Le media de couverture est obligatoire et valide." };
  }
  if (publishedAt === undefined) {
    return { error: "La date de publication est invalide." };
  }

  const [existingFr, existingEn] = await Promise.all([
    prisma.blogPost.findUnique({ where: { slug } }),
    prisma.blogPost.findUnique({ where: { slugEn } }),
  ]);
  if (existingFr && existingFr.id !== currentId) {
    return { error: "Ce slug francais est deja utilise." };
  }
  if (existingEn && existingEn.id !== currentId) {
    return { error: "Ce slug anglais est deja utilise." };
  }

  const mediaAssetIds = [
    coverMediaAssetId,
    ...blocks.map((block) => block.mediaAssetId),
  ].filter((id): id is string => Boolean(id));
  const mediaAssets = mediaAssetIds.length
    ? await prisma.mediaAsset.findMany({
        where: { id: { in: mediaAssetIds } },
        select: { id: true, url: true, mediaType: true, active: true, posterUrl: true },
      })
    : [];
  const mediaAssetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  for (const id of mediaAssetIds) {
    if (!mediaAssetById.has(id)) return { error: "Un media selectionne est invalide." };
  }

  const coverAsset = coverMediaAssetId ? mediaAssetById.get(coverMediaAssetId) : null;
  if (coverAsset) {
    if (!coverAsset.active) return { error: "Le media de couverture est invalide." };
    if (coverAsset.url !== coverMediaUrl) {
      return {
        error: "La couverture ne correspond pas au media selectionne.",
      };
    }
  }

  const warnings: string[] = [];
  const sanitizedBlocks = blocks.map((block, index) => {
    const label = `Bloc ${index + 1}`;

    if (block.type === "RICHTEXT") {
      if (!block.contentHtml || isBlankRichText(block.contentHtml)) {
        throw new Error(`${label}: le contenu rich text est obligatoire.`);
      }
      const contentHtml = sanitizeRichTextHtml(block.contentHtml);
      const contentHtmlEn =
        block.contentHtmlEn && !isBlankRichText(block.contentHtmlEn)
          ? sanitizeRichTextHtml(block.contentHtmlEn)
          : null;

      if (contentHtml !== block.contentHtml || contentHtmlEn !== (block.contentHtmlEn || null)) {
        warnings.push(`${label}: du HTML non supporte a ete nettoye.`);
      }

      return {
        id: block.id,
        order: index,
        type: block.type,
        contentHtml,
        contentHtmlEn,
        mediaUrl: null,
        mediaAssetId: null,
      };
    }

    if (!block.mediaUrl || !isValidMediaUrl(block.mediaUrl)) {
      throw new Error(`${label}: l'URL media est obligatoire et valide.`);
    }

    const mediaAsset = block.mediaAssetId
      ? mediaAssetById.get(block.mediaAssetId)
      : null;
    const expectedMediaType = block.type;
    if (mediaAsset) {
      if (!mediaAsset.active || mediaAsset.mediaType !== expectedMediaType) {
        throw new Error(`${label}: le media selectionne est invalide.`);
      }
      if (mediaAsset.url !== block.mediaUrl) {
        throw new Error(`${label}: l'URL ne correspond pas au media selectionne.`);
      }
    } else if (inferMediaTypeFromUrl(block.mediaUrl) !== expectedMediaType) {
      throw new Error(`${label}: le type de media ne correspond pas a l'URL.`);
    }
    if (block.type === "VIDEO" && !mediaAsset?.posterUrl) {
      warnings.push(`${label}: poster conseille pour une video.`);
    }

    return {
      id: block.id,
      order: index,
      type: block.type,
      contentHtml: null,
      contentHtmlEn: null,
      mediaUrl: block.mediaUrl,
      mediaAssetId: block.mediaAssetId || null,
    };
  });

  if (publishedAt && sanitizedBlocks.length === 0) {
    warnings.push("Article publie sans bloc de contenu.");
  }

  return {
    data: {
      title,
      titleEn,
      eyebrow,
      eyebrowEn,
      slug,
      slugEn,
      seoDescription,
      seoDescriptionEn,
      coverMediaUrl,
      coverMediaAssetId,
      tags,
      tagsEn,
      publishedAt,
      blocks: sanitizedBlocks,
    },
    warnings,
  };
};

const saveBlocks = async (
  tx: Pick<typeof prisma, "blogPostBlock">,
  postId: string,
  blocks: NonNullable<
    Awaited<ReturnType<typeof validateBlogPostPayload>>["data"]
  >["blocks"],
) => {
  const incomingIds = blocks
    .map((block) => block.id)
    .filter((id): id is string => Boolean(id));

  await tx.blogPostBlock.deleteMany({
    where: {
      postId,
      ...(incomingIds.length ? { id: { notIn: incomingIds } } : {}),
    },
  });

  for (const block of blocks) {
    const data = {
      order: block.order,
      type: block.type,
      contentHtml: block.contentHtml,
      contentHtmlEn: block.contentHtmlEn,
      mediaUrl: block.mediaUrl,
      mediaAssetId: block.mediaAssetId,
    };

    if (block.id) {
      await tx.blogPostBlock.updateMany({
        where: { id: block.id, postId },
        data,
      });
    } else {
      await tx.blogPostBlock.create({
        data: { ...data, postId },
      });
    }
  }
};

export const createBlogPost = async (formData: FormData): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = await validateBlogPostPayload(formData);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.blogPost.create({
        data: {
          title: parsed.data.title,
          titleEn: parsed.data.titleEn,
          eyebrow: parsed.data.eyebrow,
          eyebrowEn: parsed.data.eyebrowEn,
          slug: parsed.data.slug,
          slugEn: parsed.data.slugEn,
          seoDescription: parsed.data.seoDescription,
          seoDescriptionEn: parsed.data.seoDescriptionEn,
          coverMediaUrl: parsed.data.coverMediaUrl,
          coverMediaAssetId: parsed.data.coverMediaAssetId,
          tags: parsed.data.tags,
          tagsEn: parsed.data.tagsEn,
          publishedAt: parsed.data.publishedAt,
        },
      });
      await saveBlocks(tx, created.id, parsed.data.blocks);
      return created;
    });

    revalidatePath("/trailblaze");
    return { success: true, id: post.id, warnings: parsed.warnings };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const updateBlogPost = async (
  id: string,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const parsed = await validateBlogPostPayload(formData, id);
    if ("error" in parsed) return { success: false, error: parsed.error };

    await prisma.$transaction(async (tx) => {
      const current = await tx.blogPost.findUnique({ where: { id }, select: { id: true } });
      if (!current) throw new Error("Article introuvable.");

      await tx.blogPost.update({
        where: { id },
        data: {
          title: parsed.data.title,
          titleEn: parsed.data.titleEn,
          eyebrow: parsed.data.eyebrow,
          eyebrowEn: parsed.data.eyebrowEn,
          slug: parsed.data.slug,
          slugEn: parsed.data.slugEn,
          seoDescription: parsed.data.seoDescription,
          seoDescriptionEn: parsed.data.seoDescriptionEn,
          coverMediaUrl: parsed.data.coverMediaUrl,
          coverMediaAssetId: parsed.data.coverMediaAssetId,
          tags: parsed.data.tags,
          tagsEn: parsed.data.tagsEn,
          publishedAt: parsed.data.publishedAt,
        },
      });
      await saveBlocks(tx, id, parsed.data.blocks);
    });

    revalidatePath("/trailblaze");
    revalidatePath(`/trailblaze/${id}/edit`);
    return { success: true, id, warnings: parsed.warnings };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const publishBlogPost = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { _count: { select: { blocks: true } } },
    });
    if (!post) return { success: false, error: "Article introuvable." };

    if (!post.title || !post.titleEn || !post.slug || !post.slugEn || !post.coverMediaUrl) {
      return {
        success: false,
        error:
          "Impossible de publier sans titres, slugs et media de couverture.",
      };
    }

    if (!post.publishedAt) {
      await prisma.blogPost.update({
        where: { id },
        data: { publishedAt: new Date() },
      });
    }

    revalidatePath("/trailblaze");
    revalidatePath(`/trailblaze/${id}/edit`);
    return {
      success: true,
      warnings:
        post._count.blocks === 0
          ? ["Article publie sans bloc de contenu."]
          : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const unpublishBlogPost = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.blogPost.update({ where: { id }, data: { publishedAt: null } });
    revalidatePath("/trailblaze");
    revalidatePath(`/trailblaze/${id}/edit`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const deleteBlogPost = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath("/trailblaze");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};
