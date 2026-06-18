export const isValidMediaUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const normalizeNullable = (value: FormDataEntryValue | null) => {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue.length ? stringValue : null;
};

export const normalizeRequired = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

export const parseNonNegativeInteger = (value: FormDataEntryValue | null) => {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const parseTags = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export const parseDateOrNull = (value: FormDataEntryValue | null) => {
  const stringValue = typeof value === "string" ? value.trim() : "";
  if (!stringValue) return null;

  const date = new Date(stringValue);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
