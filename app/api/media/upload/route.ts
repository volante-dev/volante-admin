import { NextResponse } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
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
