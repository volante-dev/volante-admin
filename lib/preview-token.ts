import { createHmac } from "crypto";
import { getFrontendAppUrl } from "./config";

type PreviewPayload = {
  slug: string;
  exp: number;
};

const getPreviewSecret = () => process.env.PREVIEW_SECRET;

const toBase64Url = (value: string | Buffer) =>
  Buffer.from(value).toString("base64url");

export const createPreviewToken = (slug: string) => {
  const secret = getPreviewSecret();
  if (!secret || secret.length < 32) return null;

  const payload: PreviewPayload = {
    slug,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const createProjectPreviewUrl = (
  slug: string,
  published: boolean,
) => {
  const url = new URL(`/portfolio/${slug}`, getFrontendAppUrl());
  url.searchParams.set("preview", "true");

  const token = createPreviewToken(slug);
  if (token) {
    url.searchParams.set("token", token);
  } else if (!published) {
    return null;
  }

  return url.toString();
};

export const createBlogPostPreviewUrl = (
  slug: string,
  published: boolean,
) => {
  const url = new URL(`/trailblaze/${slug}`, getFrontendAppUrl());
  url.searchParams.set("preview", "true");

  const token = createPreviewToken(slug);
  if (token) {
    url.searchParams.set("token", token);
  } else if (!published) {
    return null;
  }

  return url.toString();
};
