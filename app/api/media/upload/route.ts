import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireCrmAccess } from "@/lib/auth-guard";

const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
];

export const POST = async (request: Request) => {
  try {
    await requireCrmAccess();
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await requireCrmAccess();
        return {
          allowedContentTypes,
          addRandomSuffix: true,
          maximumSizeInBytes: 1024 * 1024 * 200,
        };
      },
      onUploadCompleted: async () => {
        await requireCrmAccess();
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'upload du media.",
      },
      { status: 400 },
    );
  }
};
