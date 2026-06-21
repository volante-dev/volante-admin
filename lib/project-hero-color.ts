import sharp from "sharp";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const SAMPLE_SIZE = 64;
const MIN_LUMINANCE = 0.16;
const MIN_SOURCE_SATURATION = 0.12;
const MIN_OUTPUT_SATURATION = 0.34;
const MIN_COLOR_DISTANCE = 48;
const FALLBACK_PALETTE = ["#3F7168", "#A66542", "#D09B2F", "#6079A8"];

type Rgb = { r: number; g: number; b: number };
type Bucket = Rgb & { count: number; score: number };
type Hsl = { h: number; s: number; l: number };

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

const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  if (delta === 0) return { h: 0, s: 0, l: lightness };

  const sat = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (maximum === red) hue = ((green - blue) / delta) % 6;
  else if (maximum === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return { h: ((hue * 60 + 360) % 360) / 360, s: sat, l: lightness };
};

const hslToRgb = ({ h, s, l }: Hsl): Rgb => {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = h * 6;
  const intermediate = chroma * (1 - Math.abs((section % 2) - 1));
  const values =
    section < 1
      ? [chroma, intermediate, 0]
      : section < 2
        ? [intermediate, chroma, 0]
        : section < 3
          ? [0, chroma, intermediate]
          : section < 4
            ? [0, intermediate, chroma]
            : section < 5
              ? [intermediate, 0, chroma]
              : [chroma, 0, intermediate];
  const match = l - chroma / 2;
  return {
    r: (values[0] + match) * 255,
    g: (values[1] + match) * 255,
    b: (values[2] + match) * 255,
  };
};

const enrichColor = (color: Rgb) => {
  const hsl = rgbToHsl(color);
  return hslToRgb({ ...hsl, s: Math.max(hsl.s, MIN_OUTPUT_SATURATION) });
};

const randomBetween = (minimum: number, maximum: number) =>
  minimum + Math.random() * (maximum - minimum);

const varyColor = (color: Rgb) => {
  const hsl = rgbToHsl(color);
  return hslToRgb({
    h: (hsl.h + randomBetween(-0.018, 0.018) + 1) % 1,
    s: Math.max(
      MIN_OUTPUT_SATURATION,
      Math.min(0.82, hsl.s + randomBetween(-0.035, 0.09)),
    ),
    l: Math.max(0.3, Math.min(0.78, hsl.l + randomBetween(-0.055, 0.055))),
  });
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

const fromHex = (value: string): Rgb | null => {
  const match = value.match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  return {
    r: Number.parseInt(match[1].slice(0, 2), 16),
    g: Number.parseInt(match[1].slice(2, 4), 16),
    b: Number.parseInt(match[1].slice(4, 6), 16),
  };
};

const buildPalette = (
  pixels: Buffer,
  channels: number,
  previousPalette: string[],
) => {
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

  const candidates: Bucket[] = Array.from(histogram.values()).reduce<Bucket[]>(
    (result, bucket) => {
      if (bucket.count < 2) return result;
      const sourceColor = {
        r: bucket.r / bucket.count,
        g: bucket.g / bucket.count,
        b: bucket.b / bucket.count,
      };
      const chroma = saturation(sourceColor);
      if (chroma < MIN_SOURCE_SATURATION) return result;
      const color = enrichColor(sourceColor);
      const lightness = luminance(color);
      const highlightPenalty = lightness > 0.9 ? 0.45 : 1;
      result.push({
        ...color,
        count: bucket.count,
        score: bucket.count * (0.65 + chroma * 1.35) * highlightPenalty,
      });
      return result;
    },
    [],
  ).sort((first, second) => second.score - first.score);

  const selected: Bucket[] = [];
  const previousColors = previousPalette
    .map(fromHex)
    .filter((color): color is Rgb => color !== null);
  const pool = candidates.slice(0, 48);

  const addCandidates = (minimumDistance: number, previousDistance: number) => {
    while (selected.length < 4) {
      const eligible = pool.filter(
        (candidate) =>
          selected.every((current) => distance(current, candidate) >= minimumDistance) &&
          previousColors.every((previous) => distance(previous, candidate) >= previousDistance),
      );
      if (!eligible.length) break;
      const weighted = eligible.map((candidate) => ({
        candidate,
        weight: candidate.score * randomBetween(0.45, 1.55),
      }));
      const chosen = weighted.sort((first, second) => second.weight - first.weight)[0]
        .candidate;
      const varied = Array.from({ length: 6 }, () => varyColor(chosen)).find(
        (candidate) =>
          selected.every((current) => distance(current, candidate) >= minimumDistance),
      );
      selected.push({ ...(varied ?? chosen), count: chosen.count, score: chosen.score });
      pool.splice(pool.indexOf(chosen), 1);
    }
  };

  addCandidates(MIN_COLOR_DISTANCE, 34);
  addCandidates(MIN_COLOR_DISTANCE, 18);
  addCandidates(MIN_COLOR_DISTANCE, 0);

  for (const fallback of FALLBACK_PALETTE) {
    if (selected.length === 4) break;
    const color = fromHex(fallback);
    if (
      color &&
      selected.every((current) => distance(current, color) >= MIN_COLOR_DISTANCE)
    ) {
      selected.push({ ...varyColor(color), count: 0, score: 0 });
    }
  }

  const hueOffset = Math.random();
  for (let index = 0; selected.length < 4 && index < 24; index += 1) {
    const color = hslToRgb({
      h: (hueOffset + index / 24) % 1,
      s: randomBetween(0.42, 0.62),
      l: randomBetween(0.5, 0.68),
    });
    if (selected.every((current) => distance(current, color) >= MIN_COLOR_DISTANCE)) {
      selected.push({ ...color, count: 0, score: 0 });
    }
  }

  return selected.slice(0, 4).map(toHex);
};

export const extractProjectHeroPalette = async (
  imageUrl: string,
  previousPalette: string[] = [],
) => {
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

  return buildPalette(data, info.channels, previousPalette);
};
