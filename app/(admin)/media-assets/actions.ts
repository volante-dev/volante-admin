"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { isValidMediaUrl, normalizeNullable, normalizeRequired } from "@/lib/validation";
import type { MediaAssetData, MediaAssetType } from "@/components/admin/media/media-types";

type ActionResult = {
  success: boolean;
  error?: string;
  asset?: MediaAssetData;
};

type UploadedBlob = {
  url: string;
  pathname: string;
  contentType?: string;
  size?: number;
};

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const videoTypes = new Set(["video/mp4"]);

const inferMediaType = (mimeType: string | null | undefined): MediaAssetType =>
  mimeType && videoTypes.has(mimeType) ? "VIDEO" : "IMAGE";

const parseTags = (value: FormDataEntryValue | string[] | null | undefined) => {
  if (Array.isArray(value)) return value.map((tag) => tag.trim()).filter(Boolean);
  return String(value ?? "")
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const toMediaAssetData = (
  asset: {
    id: string;
    url: string;
    pathname: string;
    mediaType: MediaAssetType;
    mimeType: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    posterUrl: string | null;
    posterPathname: string | null;
    posterMimeType: string | null;
    posterSize: number | null;
    name: string;
    alt: string | null;
    altEn: string | null;
    tags: string[];
    active: boolean;
    createdAt: Date;
  },
  usageCount = 0,
): MediaAssetData => ({
  ...asset,
  createdAt: asset.createdAt.toISOString(),
  usageCount,
});

const getUsageCount = async (asset: { id: string; url: string }) => {
  const [
    projectImages,
    slideMedia,
    legacySlidePosters,
    studioFounderOneImages,
    studioFounderTwoImages,
    testimonialAvatars,
  ] = await Promise.all([
    prisma.project.count({
      where: { OR: [{ imageAssetId: asset.id }, { imageUrl: asset.url }] },
    }),
    prisma.projectSlide.count({
      where: { OR: [{ mediaAssetId: asset.id }, { mediaUrl: asset.url }] },
    }),
    prisma.projectSlide.count({ where: { posterUrl: asset.url } }),
    prisma.studioPageContent.count({
      where: {
        OR: [
          { founderOneImageAssetId: asset.id },
          { founderOneImageUrl: asset.url },
        ],
      },
    }),
    prisma.studioPageContent.count({
      where: {
        OR: [
          { founderTwoImageAssetId: asset.id },
          { founderTwoImageUrl: asset.url },
        ],
      },
    }),
    prisma.testimonial.count({
      where: { OR: [{ avatarAssetId: asset.id }, { avatarUrl: asset.url }] },
    }),
  ]);

  return (
    projectImages +
    slideMedia +
    legacySlidePosters +
    studioFounderOneImages +
    studioFounderTwoImages +
    testimonialAvatars
  );
};

export const createMediaAssetFromUpload = async (
  blob: UploadedBlob,
  metadata: {
    name: string;
    alt?: string;
    altEn?: string;
    tags?: string[];
    mimeType?: string;
    size?: number;
  },
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const name = metadata.name.trim();
    const mimeType = metadata.mimeType ?? blob.contentType ?? null;

    if (!isValidMediaUrl(blob.url)) {
      return { success: false, error: "L'URL du media est invalide." };
    }
    if (name.length < 2) {
      return { success: false, error: "Le nom doit contenir au moins 2 caracteres." };
    }
    if (mimeType && !imageTypes.has(mimeType) && !videoTypes.has(mimeType)) {
      return { success: false, error: "Type de media non supporte." };
    }

    const asset = await prisma.mediaAsset.upsert({
      where: { url: blob.url },
      create: {
        url: blob.url,
        pathname: blob.pathname,
        mediaType: inferMediaType(mimeType),
        mimeType,
        size: metadata.size ?? blob.size ?? null,
        name,
        alt: metadata.alt?.trim() || null,
        altEn: metadata.altEn?.trim() || null,
        tags: metadata.tags ?? [],
      },
      update: {
        pathname: blob.pathname,
        mediaType: inferMediaType(mimeType),
        mimeType,
        size: metadata.size ?? blob.size ?? null,
        name,
        alt: metadata.alt?.trim() || null,
        altEn: metadata.altEn?.trim() || null,
        tags: metadata.tags ?? [],
        active: true,
      },
    });

    revalidatePath("/media-assets");
    return { success: true, asset: toMediaAssetData(asset) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const updateMediaAsset = async (
  id: string,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const name = normalizeRequired(formData.get("name"));
    const posterUrl = normalizeNullable(formData.get("posterUrl"));
    if (name.length < 2) {
      return { success: false, error: "Le nom doit contenir au moins 2 caracteres." };
    }
    if (posterUrl && !isValidMediaUrl(posterUrl)) {
      return { success: false, error: "L'URL du poster est invalide." };
    }

    const current = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Media introuvable." };
    const posterSizeValue = normalizeNullable(formData.get("posterSize"));
    const parsedPosterSize = posterSizeValue
      ? Number.parseInt(posterSizeValue, 10)
      : null;
    if (
      posterSizeValue &&
      (parsedPosterSize === null ||
        !Number.isFinite(parsedPosterSize) ||
        parsedPosterSize < 0)
    ) {
      return { success: false, error: "La taille du poster est invalide." };
    }
    const posterSize = parsedPosterSize;
    const posterData =
      formData.has("posterUrl") && current.mediaType === "VIDEO"
        ? {
            posterUrl,
            posterPathname: normalizeNullable(formData.get("posterPathname")),
            posterMimeType: normalizeNullable(formData.get("posterMimeType")),
            posterSize,
          }
        : {};

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        name,
        alt: normalizeNullable(formData.get("alt")),
        altEn: normalizeNullable(formData.get("altEn")),
        tags: parseTags(formData.get("tags")),
        active: formData.get("active") === "true",
        ...posterData,
      },
    });

    revalidatePath("/media-assets");
    return {
      success: true,
      asset: toMediaAssetData(asset, await getUsageCount(asset)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const deleteMediaAsset = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return { success: false, error: "Media introuvable." };

    const usageCount = await getUsageCount(asset);
    if (usageCount > 0) {
      return {
        success: false,
        error: "Ce media est encore utilise et ne peut pas etre supprime.",
      };
    }

    await del(asset.url);
    await prisma.mediaAsset.delete({ where: { id } });
    revalidatePath("/media-assets");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};
