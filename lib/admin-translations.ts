export type LocaleTextTranslations<Field extends string> = Record<
  string,
  Partial<Record<Field, string | null>>
>;

export const legacyDefaultLocale = "fr";
export const legacySecondaryLocale = "en";
export const legacyLocaleCodes = [
  legacyDefaultLocale,
  legacySecondaryLocale,
] as const;

export const isLegacyLocale = (locale: string) =>
  legacyLocaleCodes.includes(locale.trim().toLowerCase() as (typeof legacyLocaleCodes)[number]);

const normalizeLocaleCode = (value: string) => value.trim().toLowerCase();

const normalizeNullableText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const parseLocaleTextTranslations = <Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): LocaleTextTranslations<Field> => {
  const raw = formData.get("translations");
  if (typeof raw !== "string" || !raw.trim()) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const output: LocaleTextTranslations<Field> = {};
  for (const [rawLocale, rawValues] of Object.entries(parsed)) {
    const locale = normalizeLocaleCode(rawLocale);
    if (!locale || !rawValues || typeof rawValues !== "object" || Array.isArray(rawValues)) {
      continue;
    }

    const values: Partial<Record<Field, string | null>> = {};
    for (const field of fields) {
      values[field] = normalizeNullableText(
        (rawValues as Record<string, unknown>)[field],
      );
    }
    output[locale] = values;
  }

  return output;
};

export const localeTextValue = <Field extends string>(
  translations: LocaleTextTranslations<Field>,
  locale: string,
  field: Field,
  fallback: string | null = null,
): string | null => translations[normalizeLocaleCode(locale)]?.[field] ?? fallback;

export const legacyDefaultTextValue = <Field extends string>(
  translations: LocaleTextTranslations<Field>,
  field: Field,
  fallback: string | null = null,
): string | null => localeTextValue(translations, legacyDefaultLocale, field, fallback);

export const legacySecondaryTextValue = <Field extends string>(
  translations: LocaleTextTranslations<Field>,
  field: Field,
  fallback: string | null = null,
): string | null => localeTextValue(translations, legacySecondaryLocale, field, fallback);

export const setLocaleTextValue = <Field extends string>(
  translations: LocaleTextTranslations<Field>,
  locale: string,
  field: Field,
  value: string | null,
) => {
  const normalizedLocale = normalizeLocaleCode(locale);
  translations[normalizedLocale] = {
    ...(translations[normalizedLocale] ?? {}),
    [field]: value,
  };
};

export const mergeLegacyLocaleTextTranslations = <Field extends string>(
  translations: LocaleTextTranslations<Field>,
  locale: string,
  values: Partial<Record<Field, string | null>>,
) => {
  const normalizedLocale = normalizeLocaleCode(locale);
  translations[normalizedLocale] = {
    ...(translations[normalizedLocale] ?? {}),
    ...values,
  };
};
