"use client";

import { useState, useTransition, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "sonner";
import { updateHomePageContent } from "@/app/(admin)/pages/home/actions";
import { TranslateButton } from "./TranslateButton";
import type { HomePageContentData } from "./home-page-types";
import type { SiteLocaleData } from "@/lib/site-locales";
import { legacyDefaultLocale, legacySecondaryLocale } from "@/lib/admin-translations";

type HomePageField =
  | "eyebrow"
  | "title"
  | "subheading"
  | "primaryCtaLabel"
  | "secondaryCtaLabel";

type EditableHomePageContent = Record<string, Record<HomePageField, string>>;

const toEditableContent = (
  content: HomePageContentData,
  locales: SiteLocaleData[],
): EditableHomePageContent => {
  const byLocale = new Map(content.translations.map((item) => [item.locale, item]));

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = byLocale.get(locale.code);
      const isLegacyDefault = locale.code === legacyDefaultLocale;
      const isLegacySecondary = locale.code === legacySecondaryLocale;

      return [
        locale.code,
        {
          eyebrow:
            translation?.eyebrow ??
            (isLegacyDefault
              ? content.eyebrow
              : isLegacySecondary
                ? content.eyebrowEn ?? ""
                : ""),
          title:
            translation?.title ??
            (isLegacyDefault
              ? content.title
              : isLegacySecondary
                ? content.titleEn ?? ""
                : ""),
          subheading:
            translation?.subheading ??
            (isLegacyDefault
              ? content.subheading
              : isLegacySecondary
                ? content.subheadingEn ?? ""
                : ""),
          primaryCtaLabel:
            translation?.primaryCtaLabel ??
            (isLegacyDefault
              ? content.primaryCtaLabel
              : isLegacySecondary
                ? content.primaryCtaLabelEn ?? ""
                : ""),
          secondaryCtaLabel:
            translation?.secondaryCtaLabel ??
            (isLegacyDefault
              ? content.secondaryCtaLabel
              : isLegacySecondary
                ? content.secondaryCtaLabelEn ?? ""
                : ""),
        },
      ];
    }),
  );
};

const requiredFields = [
  ["eyebrow", "L'eyebrow est obligatoire."],
  ["title", "Le titre est obligatoire."],
  ["subheading", "Le sous-titre est obligatoire."],
  ["primaryCtaLabel", "Le libelle du CTA portfolio est obligatoire."],
  ["secondaryCtaLabel", "Le libelle du CTA contact est obligatoire."],
] as const satisfies readonly [HomePageField, string][];

type TextFieldRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  helperText?: string;
  translateFrom?: string;
};

const TextFieldRow = ({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  rows,
  helperText,
  translateFrom,
}: TextFieldRowProps) => {
  const field = (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      multiline={multiline}
      rows={rows}
      fullWidth
      helperText={helperText}
    />
  );

  if (!translateFrom) return field;

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
      {field}
      <TranslateButton sourceText={translateFrom} onTranslated={onChange} />
    </Box>
  );
};

export const HomePageForm = ({
  content,
  locales,
}: {
  content: HomePageContentData;
  locales: SiteLocaleData[];
}) => {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeLocales = locales.length
    ? locales
    : [{ code: legacyDefaultLocale, label: "Français" } as SiteLocaleData];
  const defaultLocale = activeLocales.find((locale) => locale.isDefault)?.code ?? activeLocales[0].code;
  const [fields, setFields] = useState(() => toEditableContent(content, activeLocales));

  const updateField =
    (locale: string, field: HomePageField) => (value: string) => {
      setFields((current) => ({
        ...current,
        [locale]: { ...current[locale], [field]: value },
      }));
    };

  const validateClient = () => {
    const defaultFields = fields[defaultLocale];
    for (const [field, message] of requiredFields) {
      if (!defaultFields?.[field as HomePageField]?.trim() || defaultFields[field as HomePageField].trim().length < 2) {
        return message;
      }
    }

    return null;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientError = validateClient();
    setError(clientError);
    if (clientError) return;

    const formData = new FormData();
    formData.set("translations", JSON.stringify(fields));
    const legacyDefaultFields = fields[legacyDefaultLocale] ?? fields[defaultLocale];
    const legacySecondaryFields = fields[legacySecondaryLocale] ?? {
      eyebrow: "",
      title: "",
      subheading: "",
      primaryCtaLabel: "",
      secondaryCtaLabel: "",
    };
    formData.set("eyebrow", legacyDefaultFields.eyebrow);
    formData.set("title", legacyDefaultFields.title);
    formData.set("subheading", legacyDefaultFields.subheading);
    formData.set("primaryCtaLabel", legacyDefaultFields.primaryCtaLabel);
    formData.set("secondaryCtaLabel", legacyDefaultFields.secondaryCtaLabel);
    formData.set("eyebrowEn", legacySecondaryFields.eyebrow);
    formData.set("titleEn", legacySecondaryFields.title);
    formData.set("subheadingEn", legacySecondaryFields.subheading);
    formData.set("primaryCtaLabelEn", legacySecondaryFields.primaryCtaLabel);
    formData.set("secondaryCtaLabelEn", legacySecondaryFields.secondaryCtaLabel);

    startTransition(async () => {
      const result = await updateHomePageContent(formData);
      if (result.success) {
        toast.success("Page Accueil mise a jour.");
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={submit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            {activeLocales.map((locale) => (
              <Tab key={locale.code} label={locale.nativeLabel || locale.label} />
            ))}
          </Tabs>

          {activeLocales.map((locale, index) => {
            const localeFields = fields[locale.code];
            const isDefaultLocale = locale.code === defaultLocale;
            const sourceFields = fields[defaultLocale];

            return tab === index ? (
              <Box key={locale.code} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {!isDefaultLocale && (
                  <Alert severity="info">
                    Les champs sont optionnels. La langue par defaut sera utilisee si
                    un champ reste vide.
                  </Alert>
                )}
                <Typography variant="h3">
                  {isDefaultLocale ? "Bloc apres la video" : `Bloc apres la video (${locale.code.toUpperCase()})`}
                </Typography>
                <TextFieldRow
                  label="Eyebrow"
                  value={localeFields.eyebrow}
                  onChange={updateField(locale.code, "eyebrow")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.eyebrow}
                />
                <TextFieldRow
                  label="Titre"
                  value={localeFields.title}
                  onChange={updateField(locale.code, "title")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.title}
                />
                <TextFieldRow
                  label="Sous-titre"
                  value={localeFields.subheading}
                  onChange={updateField(locale.code, "subheading")}
                  required={isDefaultLocale}
                  multiline
                  rows={4}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.subheading}
                />
                <TextFieldRow
                  label="CTA portfolio"
                  value={localeFields.primaryCtaLabel}
                  onChange={updateField(locale.code, "primaryCtaLabel")}
                  required={isDefaultLocale}
                  helperText="Le lien reste dirige vers la page portfolio."
                  translateFrom={isDefaultLocale ? undefined : sourceFields.primaryCtaLabel}
                />
                <TextFieldRow
                  label="CTA contact"
                  value={localeFields.secondaryCtaLabel}
                  onChange={updateField(locale.code, "secondaryCtaLabel")}
                  required={isDefaultLocale}
                  helperText="Le lien reste dirige vers la page contact."
                  translateFrom={isDefaultLocale ? undefined : sourceFields.secondaryCtaLabel}
                />
              </Box>
            ) : null;
          })}

          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={pending}
            >
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
