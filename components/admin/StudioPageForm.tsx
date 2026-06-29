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
import {
  legacyDefaultLocale,
  legacySecondaryLocale,
} from "@/lib/admin-translations";
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
  founderOneImageAltEn: string;
  founderTwoImageUrl: string;
  founderTwoImageAssetId: string;
  founderTwoImageAlt: string;
  founderTwoImageAltEn: string;
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
      const isLegacyDefault = locale.code === legacyDefaultLocale;
      const isLegacySecondary = locale.code === legacySecondaryLocale;

      const legacyValue = (defaultValue: string, secondaryValue: string | null) =>
        isLegacyDefault ? defaultValue : isLegacySecondary ? secondaryValue ?? "" : "";

      return [
        locale.code,
        {
          eyebrow:
            translation?.eyebrow ?? legacyValue(content.eyebrow, content.eyebrowEn),
          title: translation?.title ?? legacyValue(content.title, content.titleEn),
          intro: translation?.intro ?? legacyValue(content.intro, content.introEn),
          founderOneName:
            translation?.founderOneName ??
            legacyValue(content.founderOneName, content.founderOneNameEn),
          founderOneRole:
            translation?.founderOneRole ??
            legacyValue(content.founderOneRole, content.founderOneRoleEn),
          founderOneDescription:
            toRichTextValue(translation?.founderOneDescription ?? null) ||
            toRichTextValue(
              legacyValue(
                content.founderOneDescription,
                content.founderOneDescriptionEn,
              ),
            ),
          founderTwoName:
            translation?.founderTwoName ??
            legacyValue(content.founderTwoName, content.founderTwoNameEn),
          founderTwoRole:
            translation?.founderTwoRole ??
            legacyValue(content.founderTwoRole, content.founderTwoRoleEn),
          founderTwoDescription:
            toRichTextValue(translation?.founderTwoDescription ?? null) ||
            toRichTextValue(
              legacyValue(
                content.founderTwoDescription,
                content.founderTwoDescriptionEn,
              ),
            ),
          historyTitle:
            translation?.historyTitle ??
            legacyValue(content.historyTitle, content.historyTitleEn),
          historyContentHtml:
            toRichTextValue(translation?.historyContentHtml ?? null) ||
            toRichTextValue(
              legacyValue(content.historyContentHtml, content.historyContentHtmlEn),
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
  founderOneImageAltEn: content.founderOneImageAltEn ?? "",
  founderTwoImageUrl: content.founderTwoImageUrl,
  founderTwoImageAssetId: content.founderTwoImageAssetId ?? "",
  founderTwoImageAlt: content.founderTwoImageAlt ?? "",
  founderTwoImageAltEn: content.founderTwoImageAltEn ?? "",
});

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
    locales.length ? locales : [{ code: legacyDefaultLocale, label: "Français" } as SiteLocaleData];
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

    const legacyDefaultFields = localizedFields[legacyDefaultLocale] ?? defaultFields;
    const legacySecondaryFields = localizedFields[legacySecondaryLocale] ?? ({} as Record<StudioPageTextField, string>);

    Object.entries(legacyDefaultFields).forEach(([key, value]) => {
      formData.set(key, value);
    });
    formData.set("eyebrowEn", legacySecondaryFields.eyebrow ?? "");
    formData.set("titleEn", legacySecondaryFields.title ?? "");
    formData.set("introEn", legacySecondaryFields.intro ?? "");
    formData.set("founderOneNameEn", legacySecondaryFields.founderOneName ?? "");
    formData.set("founderOneRoleEn", legacySecondaryFields.founderOneRole ?? "");
    formData.set(
      "founderOneDescriptionEn",
      legacySecondaryFields.founderOneDescription ?? "",
    );
    formData.set("founderTwoNameEn", legacySecondaryFields.founderTwoName ?? "");
    formData.set("founderTwoRoleEn", legacySecondaryFields.founderTwoRole ?? "");
    formData.set(
      "founderTwoDescriptionEn",
      legacySecondaryFields.founderTwoDescription ?? "",
    );
    formData.set("historyTitleEn", legacySecondaryFields.historyTitle ?? "");
    formData.set("historyContentHtmlEn", legacySecondaryFields.historyContentHtml ?? "");

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
                />
                <TextFieldRow
                  label="Titre"
                  value={fields.title}
                  onChange={updateLocalizedField(locale.code, "title")}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.title}
                />
                <TextFieldRow
                  label="Texte introductif"
                  value={fields.intro}
                  onChange={updateLocalizedField(locale.code, "intro")}
                  required={isDefaultLocale}
                  multiline
                  rows={4}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.intro}
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
                />
                <TextFieldRow
                  label="Role"
                  value={fields.founderOneRole}
                  onChange={updateLocalizedField(locale.code, "founderOneRole")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.founderOneRole}
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
                />
                <TextFieldRow
                  label="Role"
                  value={fields.founderTwoRole}
                  onChange={updateLocalizedField(locale.code, "founderTwoRole")}
                  required={isDefaultLocale}
                  translateFrom={isDefaultLocale ? undefined : sourceFields.founderTwoRole}
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
              {(mediaFields.founderOneImageAlt || mediaFields.founderOneImageAltEn) && (
                <Alert severity="info">
                  Ancien alt conserve en lecture seule :{" "}
                  {mediaFields.founderOneImageAlt || "N/A"}
                  {mediaFields.founderOneImageAltEn
                    ? ` / ${mediaFields.founderOneImageAltEn}`
                    : ""}
                  . Les nouveaux alts se gerent depuis la galerie.
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
              {(mediaFields.founderTwoImageAlt || mediaFields.founderTwoImageAltEn) && (
                <Alert severity="info">
                  Ancien alt conserve en lecture seule :{" "}
                  {mediaFields.founderTwoImageAlt || "N/A"}
                  {mediaFields.founderTwoImageAltEn
                    ? ` / ${mediaFields.founderTwoImageAltEn}`
                    : ""}
                  . Les nouveaux alts se gerent depuis la galerie.
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
