import { NextResponse } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { requireCrmAccess } from "@/lib/auth-guard";
import { describeUnknownError } from "@/lib/error-utils";

const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/quicktime",
  "video/mov",
  "video/x-quicktime",
];

export const POST = async (request: Request) => {
  try {
    await requireCrmAccess();
    const body = (await request.json()) as HandleUploadPresignedBody;

    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        await requireCrmAccess();
        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes,
            maximumSizeInBytes: 1024 * 1024 * 200,
          }),
          urlOptions: {
            addRandomSuffix: true,
            allowedContentTypes,
            maximumSizeInBytes: 1024 * 1024 * 200,
          },
        };
      },
      onUploadCompleted: async () => {
        await requireCrmAccess();
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = describeUnknownError(error);
    console.error("[media/upload] Echec generation token upload", {
      error,
      message,
    });
    return NextResponse.json(
      {
        error: message === "Erreur inconnue" ? "Erreur lors de l'upload du media." : message,
      },
      { status: 400 },
    );
  }
};
