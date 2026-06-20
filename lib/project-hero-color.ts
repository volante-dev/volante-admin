import sharp from "sharp";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const normalizeHexColor = (value: string | null | undefined) => {
  const color = value?.trim();
  if (!color) return null;
  if (!HEX_COLOR.test(color)) return undefined;

  const hex = color.slice(1);
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((character) => character.repeat(2))
      .join("")}`.toUpperCase();
  }

  return `#${hex.toUpperCase()}`;
};

const toHex = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");

export const extractProjectHeroColor = async (imageUrl: string) => {
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: "image/*" },
  });

  if (!response.ok) {
    throw new Error(`Image inaccessible (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Le media de couverture n'est pas une image.");
  }

  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_IMAGE_BYTES) {
    throw new Error("L'image de couverture depasse 25 Mo.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("L'image de couverture depasse 25 Mo.");
  }

  const { dominant } = await sharp(buffer, { failOn: "error" }).stats();
  return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`.toUpperCase();
};
