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
import { updateFooterContent } from "@/app/(admin)/pages/footer/actions";
import { TranslateButton } from "./TranslateButton";
import type { FooterContentData } from "./footer-content-types";
import type { SiteLocaleData } from "@/lib/site-locales";
import { defaultSiteLocaleCode } from "@/lib/admin-translations";

type FooterContentField =
  | "tagline"
  | "contactHeading"
  | "contactEmail"
  | "contactSocialLabel"
  | "legalText"
  | "madeWithCare";

type EditableFooterContent = Record<string, Record<FooterContentField, string>>;

const toEditableContent = (
  content: FooterContentData,
  locales: SiteLocaleData[],
): EditableFooterContent => {
  const byLocale = new Map(content.translations.map((item) => [item.locale, item]));

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = byLocale.get(locale.code);
      const isLegacyDefault = locale.code === defaultSiteLocaleCode;

      return [
        locale.code,
        {
          tagline:
            translation?.tagline ?? (isLegacyDefault ? content.tagline : ""),
          contactHeading:
            translation?.contactHeading ??
            (isLegacyDefault ? content.contactHeading : ""),
          contactEmail:
            translation?.contactEmail ??
            (isLegacyDefault ? content.contactEmail : ""),
          contactSocialLabel:
            translation?.contactSocialLabel ??
            (isLegacyDefault ? content.contactSocialLabel : ""),
          legalText:
            translation?.legalText ?? (isLegacyDefault ? content.legalText : ""),
          madeWithCare:
            translation?.madeWithCare ??
            (isLegacyDefault ? content.madeWithCare : ""),
        },
      ];
    }),
  );
};

const requiredFields = [
  ["tagline", "Le sous-titre Studio Volante est obligatoire."],
  ["contactHeading", "Le titre du bloc contact est obligatoire."],
  ["contactEmail", "L'email de contact est obligatoire."],
  ["contactSocialLabel", "Le lien social est obligatoire."],
  ["legalText", "La mention legale est obligatoire."],
  ["madeWithCare", "La mention fait avec soin est obligatoire."],
] as const satisfies readonly [FooterContentField, string][];

type TextFieldRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  helperText?: string;
  translateFrom?: string;
  targetLocale?: string;
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
  targetLocale,
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
      <TranslateButton
        sourceText={translateFrom}
        targetLocale={targetLocale}
        onTranslated={onChange}
      />
    </Box>
  );
};

export const FooterContentForm = ({
  content,
  locales,
}: {
  content: FooterContentData;
  locales: SiteLocaleData[];
}) => {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeLocales = locales.length
    ? locales
    : [{ code: defaultSiteLocaleCode, label: "Francais" } as SiteLocaleData];
  const defaultLocale =
    activeLocales.find((locale) => locale.isDefault)?.code ?? activeLocales[0].code;
  const [fields, setFields] = useState(() =>
    toEditableContent(content, activeLocales),
  );

  const updateField =
    (locale: string, field: FooterContentField) => (value: string) => {
      setFields((current) => ({
        ...current,
        [locale]: { ...current[locale], [field]: value },
      }));
    };

  const validateClient = () => {
    const defaultFields = fields[defaultLocale];
    for (const [field, message] of requiredFields) {
      if (!defaultFields?.[field]?.trim() || defaultFields[field].trim().length < 2) {
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
    const defaultLocaleFields = fields[defaultSiteLocaleCode] ?? fields[defaultLocale];
    formData.set("tagline", defaultLocaleFields.tagline);
    formData.set("contactHeading", defaultLocaleFields.contactHeading);
    formData.set("contactEmail", defaultLocaleFields.contactEmail);
    formData.set("contactSocialLabel", defaultLocaleFields.contactSocialLabel);
    formData.set("legalText", defaultLocaleFields.legalText);
    formData.set("madeWithCare", defaultLocaleFields.madeWithCare);

    startTransition(async () => {
      const result = await updateFooterContent(formData);
      if (result.success) {
        toast.success("Footer mis a jour.");
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
                  {isDefaultLocale ? "Footer" : `Footer (${locale.code.toUpperCase()})`}
                </Typography>
                <TextFieldRow
                  label="Sous-titre sous Studio Volante"
                  value={localeFields.tagline}
                  onChange={updateField(locale.code, "tagline")}
                  required={isDefaultLocale}
                  multiline
                  rows={3}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.tagline}
                  targetLocale={locale.code}
                />
                <TextFieldRow
                  label="Titre du bloc contact"
                  value={localeFields.contactHeading}
                  onChange={updateField(locale.code, "contactHeading")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.contactHeading}
                  targetLocale={locale.code}
                />
                <TextFieldRow
                  label="Email de contact"
                  value={localeFields.contactEmail}
                  onChange={updateField(locale.code, "contactEmail")}
                  required={isDefaultLocale}
                  helperText="Affiche dans le bloc contact du footer."
                />
                <TextFieldRow
                  label="Social"
                  value={localeFields.contactSocialLabel}
                  onChange={updateField(locale.code, "contactSocialLabel")}
                  required={isDefaultLocale}
                  helperText="Exemple : @vlnt.studio"
                />
                <TextFieldRow
                  label="Mention legale"
                  value={localeFields.legalText}
                  onChange={updateField(locale.code, "legalText")}
                  required={isDefaultLocale}
                  helperText="Le footer ajoute automatiquement l'annee avant ce texte."
                  translateFrom={isDefaultLocale ? undefined : sourceFields.legalText}
                  targetLocale={locale.code}
                />
                <TextFieldRow
                  label="Fait avec soin"
                  value={localeFields.madeWithCare}
                  onChange={updateField(locale.code, "madeWithCare")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.madeWithCare}
                  targetLocale={locale.code}
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
