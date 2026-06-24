"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { del, put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import { describeUnknownError } from "@/lib/error-utils";
import { isValidMediaUrl, normalizeNullable, normalizeRequired } from "@/lib/validation";
import type { MediaAssetData, MediaAssetType } from "@/components/admin/media/media-types";

const MAX_OPTIMIZE_SOURCE_BYTES = 25 * 1024 * 1024;
const OPTIMIZED_CONTENT_TYPE = "image/jpeg";
const OPTIMIZED_MAX_WIDTH = 1920;
const OPTIMIZED_QUALITY = 82;

type ActionResult = {
  success: boolean;
  error?: string;
  asset?: MediaAssetData;
  optimization?: {
    applied: boolean;
    originalSize: number;
    optimizedSize: number;
    savedBytes: number;
  };
  conversion?: {
    originalSize: number | null;
    convertedSize: number;
  };
};

type UploadedBlob = {
  url: string;
  pathname: string;
  contentType?: string;
  size?: number;
};

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const videoTypes = new Set(["video/mp4", "video/quicktime", "video/mov", "video/x-quicktime"]);
const optimizableImageTypes = new Set(["image/jpeg", "image/png"]);

const inferMediaType = (mimeType: string | null | undefined): MediaAssetType =>
  mimeType && videoTypes.has(mimeType) ? "VIDEO" : "IMAGE";

const parseTags = (value: FormDataEntryValue | string[] | null | undefined) => {
  if (Array.isArray(value)) return value.map((tag) => tag.trim()).filter(Boolean);
  return String(value ?? "")
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const inferMimeTypeFromPath = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes(".png")) return "image/png";
  if (normalized.includes(".jpg") || normalized.includes(".jpeg")) return "image/jpeg";
  if (normalized.includes(".webp")) return "image/webp";
  if (normalized.includes(".avif")) return "image/avif";
  if (normalized.includes(".mp4")) return "video/mp4";
  if (normalized.includes(".mov")) return "video/quicktime";
  return null;
};

const toOptimizedJpegPathname = (pathname: string) =>
  /\.[^/.]+$/.test(pathname)
    ? pathname.replace(/\.[^/.]+$/, ".jpg")
    : `${pathname}.jpg`;

const isJpegPathname = (pathname: string) => /\.jpe?g$/i.test(pathname);

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
    const message = describeUnknownError(error);
    console.error("[media-assets] Echec creation media depuis upload", {
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size,
      metadataMimeType: metadata.mimeType,
      error,
      message,
    });
    return {
      success: false,
      error: message === "Erreur inconnue" ? "Une erreur est survenue." : message,
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

export const optimizeMediaAsset = async (id: string): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const current = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Media introuvable." };
    if (current.mediaType !== "IMAGE") {
      return { success: false, error: "Seules les images peuvent etre optimisees." };
    }

    const sourceMimeType =
      current.mimeType ??
      inferMimeTypeFromPath(current.pathname) ??
      inferMimeTypeFromPath(current.url);
    if (!sourceMimeType || !optimizableImageTypes.has(sourceMimeType)) {
      return {
        success: false,
        error: "Seuls les PNG et JPEG peuvent etre optimises.",
      };
    }

    const response = await fetch(current.url, {
      headers: { Accept: "image/png,image/jpeg" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return {
        success: false,
        error: `Image inaccessible (${response.status}).`,
      };
    }

    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_OPTIMIZE_SOURCE_BYTES) {
      return {
        success: false,
        error: "L'image depasse 25 Mo et ne peut pas etre optimisee.",
      };
    }

    const source = Buffer.from(await response.arrayBuffer());
    if (source.byteLength > MAX_OPTIMIZE_SOURCE_BYTES) {
      return {
        success: false,
        error: "L'image depasse 25 Mo et ne peut pas etre optimisee.",
      };
    }

    const originalSize = current.size ?? source.byteLength;
    const { data, info } = await sharp(source, { failOn: "error" })
      .rotate()
      .resize({
        width: OPTIMIZED_MAX_WIDTH,
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: OPTIMIZED_QUALITY, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    const needsJpegPathRepair =
      current.mimeType === OPTIMIZED_CONTENT_TYPE &&
      !isJpegPathname(current.pathname);
    if (data.byteLength >= originalSize && !needsJpegPathRepair) {
      return {
        success: true,
        asset: toMediaAssetData(current, await getUsageCount(current)),
        optimization: {
          applied: false,
          originalSize,
          optimizedSize: data.byteLength,
          savedBytes: 0,
        },
      };
    }

    const optimizedPathname = toOptimizedJpegPathname(current.pathname);
    const replacement = needsJpegPathRepair ? source : data;
    const optimizedBlob = await put(optimizedPathname, replacement, {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: OPTIMIZED_CONTENT_TYPE,
    });

    const oldUrl = current.url;
    const asset = await prisma.$transaction(async (tx) => {
      await tx.project.updateMany({
        where: { OR: [{ imageAssetId: id }, { imageUrl: oldUrl }] },
        data: { imageUrl: optimizedBlob.url },
      });
      await tx.projectSlide.updateMany({
        where: { OR: [{ mediaAssetId: id }, { mediaUrl: oldUrl }] },
        data: { mediaUrl: optimizedBlob.url },
      });
      await tx.projectSlide.updateMany({
        where: { posterUrl: oldUrl },
        data: { posterUrl: optimizedBlob.url },
      });
      await tx.studioPageContent.updateMany({
        where: {
          OR: [
            { founderOneImageAssetId: id },
            { founderOneImageUrl: oldUrl },
          ],
        },
        data: { founderOneImageUrl: optimizedBlob.url },
      });
      await tx.studioPageContent.updateMany({
        where: {
          OR: [
            { founderTwoImageAssetId: id },
            { founderTwoImageUrl: oldUrl },
          ],
        },
        data: { founderTwoImageUrl: optimizedBlob.url },
      });
      await tx.testimonial.updateMany({
        where: { OR: [{ avatarAssetId: id }, { avatarUrl: oldUrl }] },
        data: { avatarUrl: optimizedBlob.url },
      });

      return tx.mediaAsset.update({
        where: { id },
        data: {
          url: optimizedBlob.url,
          pathname: optimizedBlob.pathname,
          mimeType: OPTIMIZED_CONTENT_TYPE,
          size: replacement.byteLength,
          width: current.width ?? info.width,
          height: current.height ?? info.height,
        },
      });
    });

    if (oldUrl !== optimizedBlob.url) {
      await del(oldUrl).catch(() => undefined);
    }

    revalidatePath("/media-assets");
    revalidatePath("/projects");
    revalidatePath("/pages/studio");
    revalidatePath("/studio-values");
    return {
      success: true,
      asset: toMediaAssetData(asset, await getUsageCount(asset)),
      optimization: {
        applied: true,
        originalSize,
        optimizedSize: replacement.byteLength,
        savedBytes: Math.max(0, originalSize - replacement.byteLength),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue.",
    };
  }
};

export const replaceMediaAssetVideoWithMp4 = async (
  id: string,
  blob: UploadedBlob,
): Promise<ActionResult> => {
  try {
    await requireCrmAccess();
    const current = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Media introuvable." };
    if (current.mediaType !== "VIDEO") {
      return { success: false, error: "Seules les videos peuvent etre converties." };
    }
    if (!isValidMediaUrl(blob.url)) {
      return { success: false, error: "L'URL du media converti est invalide." };
    }
    if (blob.contentType && blob.contentType !== "video/mp4") {
      return { success: false, error: "La video convertie doit etre au format MP4." };
    }

    const oldUrl = current.url;
    const asset = await prisma.$transaction(async (tx) => {
      await tx.projectSlide.updateMany({
        where: { OR: [{ mediaAssetId: id }, { mediaUrl: oldUrl }] },
        data: { mediaUrl: blob.url },
      });

      return tx.mediaAsset.update({
        where: { id },
        data: {
          url: blob.url,
          pathname: blob.pathname,
          mediaType: "VIDEO",
          mimeType: "video/mp4",
          size: blob.size ?? null,
        },
      });
    });

    if (oldUrl !== blob.url) {
      await del(oldUrl).catch(() => undefined);
    }

    revalidatePath("/media-assets");
    revalidatePath("/projects");
    return {
      success: true,
      asset: toMediaAssetData(asset, await getUsageCount(asset)),
      conversion: {
        originalSize: current.size,
        convertedSize: blob.size ?? 0,
      },
    };
  } catch (error) {
    const message = describeUnknownError(error);
    console.error("[media-assets] Echec remplacement video MP4", {
      id,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size,
      error,
      message,
    });
    await del(blob.url).catch(() => undefined);
    return {
      success: false,
      error: message === "Erreur inconnue" ? "Une erreur est survenue." : message,
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
