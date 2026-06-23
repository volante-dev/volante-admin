import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCrmAccess } from "@/lib/auth-guard";
import type { MediaAssetType } from "@/components/admin/media/media-types";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  try {
    await requireCrmAccess();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as MediaAssetType | null;
    const q = searchParams.get("q")?.trim();

    const assets = await prisma.mediaAsset.findMany({
      where: {
        active: true,
        ...(type === "IMAGE" || type === "VIDEO" ? { mediaType: type } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { alt: { contains: q, mode: "insensitive" } },
                { altEn: { contains: q, mode: "insensitive" } },
                { tags: { has: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      take: 80,
    });

    return NextResponse.json({
      assets: assets.map((asset) => ({
        id: asset.id,
        url: asset.url,
        mediaType: asset.mediaType,
        name: asset.name,
        alt: asset.alt,
        altEn: asset.altEn,
        tags: asset.tags,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger la galerie.",
      },
      { status: 400 },
    );
  }
};
