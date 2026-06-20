import sharp from "sharp";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const SAMPLE_SIZE = 64;
const MIN_LUMINANCE = 0.16;
const MIN_COLOR_DISTANCE = 52;
const FALLBACK_PALETTE = ["#3F5E5A", "#5A817B", "#D8CAAA", "#C8D0DA"];

type Rgb = { r: number; g: number; b: number };
type Bucket = Rgb & { count: number; score: number };

const toLinear = (value: number) => {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
};

const luminance = ({ r, g, b }: Rgb) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

const saturation = ({ r, g, b }: Rgb) => {
  const maximum = Math.max(r, g, b) / 255;
  const minimum = Math.min(r, g, b) / 255;
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  if (delta === 0) return 0;
  return delta / (1 - Math.abs(2 * lightness - 1));
};

const distance = (first: Rgb, second: Rgb) =>
  Math.sqrt(
    (first.r - second.r) ** 2 +
      (first.g - second.g) ** 2 +
      (first.b - second.b) ** 2,
  );

const toHex = (color: Rgb) => {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`.toUpperCase();
};

const mixWithWhite = (color: Rgb, amount: number): Rgb => ({
  r: color.r + (255 - color.r) * amount,
  g: color.g + (255 - color.g) * amount,
  b: color.b + (255 - color.b) * amount,
});

const buildPalette = (pixels: Buffer, channels: number) => {
  const histogram = new Map<
    string,
    { r: number; g: number; b: number; count: number }
  >();

  for (let index = 0; index < pixels.length; index += channels) {
    const color = {
      r: pixels[index],
      g: pixels[index + 1],
      b: pixels[index + 2],
    };
    if (luminance(color) < MIN_LUMINANCE) continue;

    const key = `${color.r >> 4}:${color.g >> 4}:${color.b >> 4}`;
    const bucket = histogram.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += color.r;
    bucket.g += color.g;
    bucket.b += color.b;
    bucket.count += 1;
    histogram.set(key, bucket);
  }

  const candidates: Bucket[] = Array.from(histogram.values())
    .filter((bucket) => bucket.count >= 2)
    .map((bucket) => {
      const color = {
        r: bucket.r / bucket.count,
        g: bucket.g / bucket.count,
        b: bucket.b / bucket.count,
      };
      const lightness = luminance(color);
      const chroma = saturation(color);
      const highlightPenalty = lightness > 0.9 ? 0.45 : 1;
      return {
        ...color,
        count: bucket.count,
        score: bucket.count * (0.65 + chroma * 1.35) * highlightPenalty,
      };
    })
    .sort((first, second) => second.score - first.score);

  const selected: Bucket[] = [];
  const addDistinctCandidates = (minimumDistance: number) => {
    for (const candidate of candidates) {
      if (selected.length === 4) break;
      if (
        selected.every(
          (current) => distance(current, candidate) >= minimumDistance,
        )
      ) {
        selected.push(candidate);
      }
    }
  };

  addDistinctCandidates(MIN_COLOR_DISTANCE);
  addDistinctCandidates(28);

  if (selected.length > 0) {
    const base = selected[0];
    for (const amount of [0.18, 0.34, 0.5]) {
      if (selected.length === 4) break;
      const derived = { ...mixWithWhite(base, amount), count: 0, score: 0 };
      if (selected.every((current) => distance(current, derived) >= 22)) {
        selected.push(derived);
      }
    }
  }

  const palette = selected.map(toHex);
  for (const fallback of FALLBACK_PALETTE) {
    if (palette.length === 4) break;
    if (!palette.includes(fallback)) palette.push(fallback);
  }

  return palette.slice(0, 4);
};

export const extractProjectHeroPalette = async (imageUrl: string) => {
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

  const source = Buffer.from(await response.arrayBuffer());
  if (source.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("L'image de couverture depasse 25 Mo.");
  }

  const { data, info } = await sharp(source, { failOn: "error" })
    .rotate()
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "cover" })
    .flatten({ background: "#FFFFFF" })
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  return buildPalette(data, info.channels);
};
