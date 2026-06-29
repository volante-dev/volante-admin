"use client";

import { useState, useTransition } from "react";
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
import { updateStudioPageContent } from "@/app/(admin)/pages/studio/actions";
import { defaultSiteLocaleCode } from "@/lib/admin-translations";
import { isBlankRichText } from "@/lib/rich-text";
import type { SiteLocaleData } from "@/lib/site-locales";
import { MediaUrlField } from "./MediaUrlField";
import { RichTextEditor } from "./RichTextEditor";
import { TranslateButton } from "./TranslateButton";
import type { StudioPageContentData } from "./studio-page-types";

type StudioPageTextField =
  | "eyebrow"
  | "title"
  | "intro"
  | "founderOneName"
  | "founderOneRole"
  | "founderOneDescription"
  | "founderTwoName"
  | "founderTwoRole"
  | "founderTwoDescription"
  | "historyTitle"
  | "historyContentHtml";

type LocalizedStudioPageFields = Record<
  string,
  Record<StudioPageTextField, string>
>;

type StudioPageMediaFields = {
  founderOneImageUrl: string;
  founderOneImageAssetId: string;
  founderOneImageAlt: string;
  founderTwoImageUrl: string;
  founderTwoImageAssetId: string;
  founderTwoImageAlt: string;
};

const imageAccept = "image/jpeg,image/png,image/webp,image/avif";

const hasHtmlTag = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toRichTextValue = (value: string | null) => {
  const content = value ?? "";
  if (!content.trim()) return "";
  if (hasHtmlTag(content)) return content;

  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

const toLocalizedFields = (
  content: StudioPageContentData,
  locales: SiteLocaleData[],
): LocalizedStudioPageFields => {
  const byLocale = new Map(content.translations.map((item) => [item.locale, item]));

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = byLocale.get(locale.code);
      const isDefault = locale.code === defaultSiteLocaleCode;
      const localeValue = (field: StudioPageTextField, defaultValue: string) =>
        translation?.[field] ?? (isDefault ? defaultValue : "");
      const richLocaleValue = (field: StudioPageTextField, defaultValue: string) =>
        toRichTextValue(translation?.[field] ?? null) ||
        (isDefault ? toRichTextValue(defaultValue) : "");

      return [
        locale.code,
        {
          eyebrow: localeValue("eyebrow", content.eyebrow),
          title: localeValue("title", content.title),
          intro: localeValue("intro", content.intro),
          founderOneName: localeValue("founderOneName", content.founderOneName),
          founderOneRole: localeValue("founderOneRole", content.founderOneRole),
          founderOneDescription: richLocaleValue(
            "founderOneDescription",
            content.founderOneDescription,
          ),
          founderTwoName: localeValue("founderTwoName", content.founderTwoName),
          founderTwoRole: localeValue("founderTwoRole", content.founderTwoRole),
          founderTwoDescription: richLocaleValue(
            "founderTwoDescription",
            content.founderTwoDescription,
          ),
          historyTitle: localeValue("historyTitle", content.historyTitle),
          historyContentHtml: richLocaleValue(
            "historyContentHtml",
            content.historyContentHtml,
          ),
        },
      ];
    }),
  );
};

const toMediaFields = (content: StudioPageContentData): StudioPageMediaFields => ({
  founderOneImageUrl: content.founderOneImageUrl,
  founderOneImageAssetId: content.founderOneImageAssetId ?? "",
  founderOneImageAlt: content.founderOneImageAlt ?? "",
  founderTwoImageUrl: content.founderTwoImageUrl,
  founderTwoImageAssetId: content.founderTwoImageAssetId ?? "",
  founderTwoImageAlt: content.founderTwoImageAlt ?? "",
});

type TextFieldRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
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

const requiredTextFields = [
  ["intro", "Le texte introductif est obligatoire."],
  ["founderOneName", "Le nom du fondateur 1 est obligatoire."],
  ["founderOneRole", "Le role du fondateur 1 est obligatoire."],
  ["founderTwoName", "Le nom du fondateur 2 est obligatoire."],
  ["founderTwoRole", "Le role du fondateur 2 est obligatoire."],
  ["historyTitle", "Le titre Notre histoire est obligatoire."],
] as const satisfies readonly [StudioPageTextField, string][];

export const StudioPageForm = ({
  content,
  locales,
}: {
  content: StudioPageContentData;
  locales: SiteLocaleData[];
}) => {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeLocales =
    locales.length ? locales : [{ code: defaultSiteLocaleCode, label: "Français" } as SiteLocaleData];
  const defaultLocale =
    activeLocales.find((locale) => locale.isDefault)?.code ?? activeLocales[0].code;
  const [localizedFields, setLocalizedFields] = useState(() =>
    toLocalizedFields(content, activeLocales),
  );
  const [mediaFields, setMediaFields] = useState(() => toMediaFields(content));
  const photoTabIndex = activeLocales.length;
  const defaultFields = localizedFields[defaultLocale];

  const updateLocalizedField =
    (locale: string, field: StudioPageTextField) => (value: string) => {
      setLocalizedFields((current) => ({
        ...current,
        [locale]: { ...current[locale], [field]: value },
      }));
    };

  const updateMediaField =
    (field: keyof StudioPageMediaFields) => (value: string) => {
      setMediaFields((current) => ({ ...current, [field]: value }));
    };

  const validateClient = () => {
    for (const [field, message] of requiredTextFields) {
      if (!defaultFields?.[field].trim() || defaultFields[field].trim().length < 2) {
        return message;
      }
    }
    if (!mediaFields.founderOneImageUrl.trim()) {
      return "La photo du fondateur 1 est obligatoire.";
    }
    if (!mediaFields.founderTwoImageUrl.trim()) {
      return "La photo du fondateur 2 est obligatoire.";
    }
    if (isBlankRichText(defaultFields.founderOneDescription)) {
      return "La description du fondateur 1 est obligatoire.";
    }
    if (isBlankRichText(defaultFields.founderTwoDescription)) {
      return "La description du fondateur 2 est obligatoire.";
    }
    if (isBlankRichText(defaultFields.historyContentHtml)) {
      return "La description Notre histoire est obligatoire.";
    }
    return null;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const clientError = validateClient();
    setError(clientError);
    if (clientError) return;

    const formData = new FormData();
    formData.set("translations", JSON.stringify(localizedFields));

    const defaultLocaleFields = localizedFields[defaultSiteLocaleCode] ?? defaultFields;

    Object.entries(defaultLocaleFields).forEach(([key, value]) => {
      formData.set(key, value);
    });

    Object.entries(mediaFields).forEach(([key, value]) => {
      formData.set(key, value);
    });

    startTransition(async () => {
      const result = await updateStudioPageContent(formData);
      if (result.success) {
        toast.success("Page Studio mise a jour.");
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
            <Tab label="Photos" />
          </Tabs>

          {activeLocales.map((locale, index) => {
            const fields = localizedFields[locale.code];
            const sourceFields = localizedFields[defaultLocale];
            const isDefaultLocale = locale.code === defaultLocale;

            return tab === index ? (
              <Box key={locale.code} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="h3">En-tete</Typography>
                <TextFieldRow
                  label="Eyebrow"
                  value={fields.eyebrow}
                  onChange={updateLocalizedField(locale.code, "eyebrow")}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.eyebrow}
                  targetLocale={locale.code}
                />
                <TextFieldRow
                  label="Titre"
                  value={fields.title}
                  onChange={updateLocalizedField(locale.code, "title")}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.title}
                  targetLocale={locale.code}
                />
                <TextFieldRow
                  label="Texte introductif"
                  value={fields.intro}
                  onChange={updateLocalizedField(locale.code, "intro")}
                  required={isDefaultLocale}
                  multiline
                  rows={4}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.intro}
                  targetLocale={locale.code}
                />

                <Typography variant="h3" sx={{ mt: 2 }}>
                  Fondateur 1
                </Typography>
                <TextFieldRow
                  label="Nom"
                  value={fields.founderOneName}
                  onChange={updateLocalizedField(locale.code, "founderOneName")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.founderOneName}
                  targetLocale={locale.code}
                />
                <TextFieldRow
                  label="Role"
                  value={fields.founderOneRole}
                  onChange={updateLocalizedField(locale.code, "founderOneRole")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.founderOneRole}
                  targetLocale={locale.code}
                />
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <RichTextEditor
                      label="Description"
                      value={fields.founderOneDescription || "<p></p>"}
                      onChange={updateLocalizedField(
                        locale.code,
                        "founderOneDescription",
                      )}
                      error={
                        isDefaultLocale && isBlankRichText(fields.founderOneDescription)
                      }
                    />
                  </Box>
                  {!isDefaultLocale && (
                    <TranslateButton
                      sourceText={sourceFields.founderOneDescription}
                      targetLocale={locale.code}
                      onTranslated={updateLocalizedField(
                        locale.code,
                        "founderOneDescription",
                      )}
                      html
                    />
                  )}
                </Box>

                <Typography variant="h3" sx={{ mt: 2 }}>
                  Fondateur 2
                </Typography>
                <TextFieldRow
                  label="Nom"
                  value={fields.founderTwoName}
                  onChange={updateLocalizedField(locale.code, "founderTwoName")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.founderTwoName}
                  targetLocale={locale.code}
                />
                <TextFieldRow
                  label="Role"
                  value={fields.founderTwoRole}
                  onChange={updateLocalizedField(locale.code, "founderTwoRole")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.founderTwoRole}
                  targetLocale={locale.code}
                />
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <RichTextEditor
                      label="Description"
                      value={fields.founderTwoDescription || "<p></p>"}
                      onChange={updateLocalizedField(
                        locale.code,
                        "founderTwoDescription",
                      )}
                      error={
                        isDefaultLocale && isBlankRichText(fields.founderTwoDescription)
                      }
                    />
                  </Box>
                  {!isDefaultLocale && (
                    <TranslateButton
                      sourceText={sourceFields.founderTwoDescription}
                      targetLocale={locale.code}
                      onTranslated={updateLocalizedField(
                        locale.code,
                        "founderTwoDescription",
                      )}
                      html
                    />
                  )}
                </Box>

                <Typography variant="h3" sx={{ mt: 2 }}>
                  Notre histoire
                </Typography>
                <TextFieldRow
                  label="Titre"
                  value={fields.historyTitle}
                  onChange={updateLocalizedField(locale.code, "historyTitle")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.historyTitle}
                  targetLocale={locale.code}
                />
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <RichTextEditor
                      label="Description"
                      value={fields.historyContentHtml || "<p></p>"}
                      onChange={updateLocalizedField(locale.code, "historyContentHtml")}
                      error={
                        isDefaultLocale && isBlankRichText(fields.historyContentHtml)
                      }
                    />
                  </Box>
                  {!isDefaultLocale && (
                    <TranslateButton
                      sourceText={sourceFields.historyContentHtml}
                      targetLocale={locale.code}
                      onTranslated={updateLocalizedField(
                        locale.code,
                        "historyContentHtml",
                      )}
                      html
                    />
                  )}
                </Box>
              </Box>
            ) : null;
          })}

          {tab === photoTabIndex && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography variant="h3">Fondateur 1</Typography>
              <MediaUrlField
                label="Photo fondateur 1"
                value={mediaFields.founderOneImageUrl}
                onChange={updateMediaField("founderOneImageUrl")}
                assetId={mediaFields.founderOneImageAssetId}
                onAssetChange={(assetId) =>
                  updateMediaField("founderOneImageAssetId")(assetId ?? "")
                }
                required
                accept={imageAccept}
                basePath="pages/studio"
                field="founder-one-photo"
                helperText="Image portrait recommandee."
              />
              {mediaFields.founderOneImageAlt && (
                <Alert severity="info">
                  Ancien alt conserve en lecture seule :{" "}
                  {mediaFields.founderOneImageAlt}. Les nouveaux alts se
                  gerent depuis la galerie.
                </Alert>
              )}

              <Typography variant="h3" sx={{ mt: 2 }}>
                Fondateur 2
              </Typography>
              <MediaUrlField
                label="Photo fondateur 2"
                value={mediaFields.founderTwoImageUrl}
                onChange={updateMediaField("founderTwoImageUrl")}
                assetId={mediaFields.founderTwoImageAssetId}
                onAssetChange={(assetId) =>
                  updateMediaField("founderTwoImageAssetId")(assetId ?? "")
                }
                required
                accept={imageAccept}
                basePath="pages/studio"
                field="founder-two-photo"
                helperText="Image portrait recommandee."
              />
              {mediaFields.founderTwoImageAlt && (
                <Alert severity="info">
                  Ancien alt conserve en lecture seule :{" "}
                  {mediaFields.founderTwoImageAlt}. Les nouveaux alts se
                  gerent depuis la galerie.
                </Alert>
              )}
            </Box>
          )}

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
