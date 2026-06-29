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
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "sonner";
import { updatePageHeaderContent } from "@/app/(admin)/pages/page-header-actions";
import { TranslateButton } from "./TranslateButton";
import type { PageHeaderContentData } from "./page-header-types";
import type { SiteLocaleData } from "@/lib/site-locales";
import { legacyDefaultLocale, legacySecondaryLocale } from "@/lib/admin-translations";

type PageHeaderField = "eyebrow" | "title" | "intro";

type EditablePageHeaderContent = Record<string, Record<PageHeaderField, string>>;

const toEditableContent = (
  content: PageHeaderContentData,
  locales: SiteLocaleData[],
): EditablePageHeaderContent => {
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
          intro:
            translation?.intro ??
            (isLegacyDefault
              ? content.intro ?? ""
              : isLegacySecondary
                ? content.introEn ?? ""
                : ""),
        },
      ];
    }),
  );
};

type TextFieldRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  translateFrom?: string;
};

const TextFieldRow = ({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  rows,
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

export const PageHeaderForm = ({
  content,
  locales,
}: {
  content: PageHeaderContentData;
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
  const isPortfolio = content.id === "portfolio";

  const updateField =
    (locale: string, field: PageHeaderField) => (value: string) => {
      setFields((current) => ({
        ...current,
        [locale]: { ...current[locale], [field]: value },
      }));
    };

  const validateClient = () => {
    const defaultFields = fields[defaultLocale];
    if (!defaultFields?.eyebrow.trim() || defaultFields.eyebrow.trim().length < 2) {
      return "L'eyebrow est obligatoire.";
    }
    if (!defaultFields?.title.trim() || defaultFields.title.trim().length < 2) {
      return "Le titre est obligatoire.";
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
    const legacySecondaryFields =
      fields[legacySecondaryLocale] ?? { eyebrow: "", title: "", intro: "" };
    formData.set("eyebrow", legacyDefaultFields.eyebrow);
    formData.set("title", legacyDefaultFields.title);
    formData.set("intro", legacyDefaultFields.intro);
    formData.set("eyebrowEn", legacySecondaryFields.eyebrow);
    formData.set("titleEn", legacySecondaryFields.title);
    formData.set("introEn", legacySecondaryFields.intro);

    startTransition(async () => {
      const result = await updatePageHeaderContent(content.id, formData);
      if (result.success) {
        toast.success("Contenu de page mis a jour.");
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
            const sourceFields = fields[defaultLocale];
            const isDefaultLocale = locale.code === defaultLocale;

            return tab === index ? (
              <Box key={locale.code} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                {isPortfolio && (
                  <TextFieldRow
                    label="Texte introductif"
                    value={localeFields.intro}
                    onChange={updateField(locale.code, "intro")}
                    multiline
                    rows={4}
                    translateFrom={isDefaultLocale ? undefined : sourceFields.intro}
                  />
                )}
              </Box>
            ) : null;
          })}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={pending}
            >
              Enregistrer
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
