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
import { isBlankRichText } from "@/lib/rich-text";
import { MediaUrlField } from "./MediaUrlField";
import { RichTextEditor } from "./RichTextEditor";
import { TranslateButton } from "./TranslateButton";
import type { StudioPageContentData } from "./studio-page-types";

type EditableStudioPageContent = Record<
  Exclude<keyof StudioPageContentData, "id">,
  string
>;

const toEditableContent = (
  content: StudioPageContentData,
): EditableStudioPageContent => ({
  eyebrow: content.eyebrow,
  eyebrowEn: content.eyebrowEn ?? "",
  title: content.title,
  titleEn: content.titleEn ?? "",
  intro: content.intro,
  introEn: content.introEn ?? "",
  founderOneName: content.founderOneName,
  founderOneNameEn: content.founderOneNameEn ?? "",
  founderOneRole: content.founderOneRole,
  founderOneRoleEn: content.founderOneRoleEn ?? "",
  founderOneDescription: content.founderOneDescription,
  founderOneDescriptionEn: content.founderOneDescriptionEn ?? "",
  founderOneImageUrl: content.founderOneImageUrl,
  founderOneImageAssetId: content.founderOneImageAssetId ?? "",
  founderOneImageAlt: content.founderOneImageAlt ?? "",
  founderOneImageAltEn: content.founderOneImageAltEn ?? "",
  founderTwoName: content.founderTwoName,
  founderTwoNameEn: content.founderTwoNameEn ?? "",
  founderTwoRole: content.founderTwoRole,
  founderTwoRoleEn: content.founderTwoRoleEn ?? "",
  founderTwoDescription: content.founderTwoDescription,
  founderTwoDescriptionEn: content.founderTwoDescriptionEn ?? "",
  founderTwoImageUrl: content.founderTwoImageUrl,
  founderTwoImageAssetId: content.founderTwoImageAssetId ?? "",
  founderTwoImageAlt: content.founderTwoImageAlt ?? "",
  founderTwoImageAltEn: content.founderTwoImageAltEn ?? "",
  historyTitle: content.historyTitle,
  historyTitleEn: content.historyTitleEn ?? "",
  historyContentHtml: content.historyContentHtml,
  historyContentHtmlEn: content.historyContentHtmlEn ?? "",
});

const requiredFields = [
  ["eyebrow", "L'eyebrow est obligatoire."],
  ["title", "Le titre est obligatoire."],
  ["intro", "Le texte introductif est obligatoire."],
  ["founderOneName", "Le nom du fondateur 1 est obligatoire."],
  ["founderOneRole", "Le role du fondateur 1 est obligatoire."],
  ["founderOneDescription", "La description du fondateur 1 est obligatoire."],
  ["founderOneImageUrl", "La photo du fondateur 1 est obligatoire."],
  ["founderTwoName", "Le nom du fondateur 2 est obligatoire."],
  ["founderTwoRole", "Le role du fondateur 2 est obligatoire."],
  ["founderTwoDescription", "La description du fondateur 2 est obligatoire."],
  ["founderTwoImageUrl", "La photo du fondateur 2 est obligatoire."],
  ["historyTitle", "Le titre Notre histoire est obligatoire."],
] as const satisfies readonly [keyof EditableStudioPageContent, string][];

const imageAccept = "image/jpeg,image/png,image/webp,image/avif";

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

export const StudioPageForm = ({
  content,
}: {
  content: StudioPageContentData;
}) => {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState(() => toEditableContent(content));

  const updateField =
    (field: keyof EditableStudioPageContent) => (value: string) => {
      setFields((current) => ({ ...current, [field]: value }));
    };

  const validateClient = () => {
    for (const [field, message] of requiredFields) {
      if (fields[field].trim().length < 2) return message;
    }
    if (isBlankRichText(fields.historyContentHtml)) {
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
    Object.entries(fields).forEach(([key, value]) => {
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
            <Tab label="Francais" />
            <Tab label="English" />
            <Tab label="Photos" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography variant="h3">En-tete</Typography>
              <TextFieldRow
                label="Eyebrow"
                value={fields.eyebrow}
                onChange={updateField("eyebrow")}
                required
              />
              <TextFieldRow
                label="Titre"
                value={fields.title}
                onChange={updateField("title")}
                required
              />
              <TextFieldRow
                label="Texte introductif"
                value={fields.intro}
                onChange={updateField("intro")}
                required
                multiline
                rows={4}
              />

              <Typography variant="h3" sx={{ mt: 2 }}>
                Fondateur 1
              </Typography>
              <TextFieldRow
                label="Nom"
                value={fields.founderOneName}
                onChange={updateField("founderOneName")}
                required
              />
              <TextFieldRow
                label="Role"
                value={fields.founderOneRole}
                onChange={updateField("founderOneRole")}
                required
              />
              <TextFieldRow
                label="Description"
                value={fields.founderOneDescription}
                onChange={updateField("founderOneDescription")}
                required
                multiline
                rows={5}
              />

              <Typography variant="h3" sx={{ mt: 2 }}>
                Fondateur 2
              </Typography>
              <TextFieldRow
                label="Nom"
                value={fields.founderTwoName}
                onChange={updateField("founderTwoName")}
                required
              />
              <TextFieldRow
                label="Role"
                value={fields.founderTwoRole}
                onChange={updateField("founderTwoRole")}
                required
              />
              <TextFieldRow
                label="Description"
                value={fields.founderTwoDescription}
                onChange={updateField("founderTwoDescription")}
                required
                multiline
                rows={5}
              />

              <Typography variant="h3" sx={{ mt: 2 }}>
                Notre histoire
              </Typography>
              <TextFieldRow
                label="Titre"
                value={fields.historyTitle}
                onChange={updateField("historyTitle")}
                required
              />
              <RichTextEditor
                label="Description"
                value={fields.historyContentHtml}
                onChange={updateField("historyContentHtml")}
                error={isBlankRichText(fields.historyContentHtml)}
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Alert severity="info">
                Les champs anglais sont optionnels. Le francais sera utilise si
                un champ reste vide.
              </Alert>
              <Typography variant="h3">Header</Typography>
              <TextFieldRow
                label="Eyebrow (EN)"
                value={fields.eyebrowEn}
                onChange={updateField("eyebrowEn")}
                translateFrom={fields.eyebrow}
              />
              <TextFieldRow
                label="Title (EN)"
                value={fields.titleEn}
                onChange={updateField("titleEn")}
                translateFrom={fields.title}
              />
              <TextFieldRow
                label="Intro (EN)"
                value={fields.introEn}
                onChange={updateField("introEn")}
                multiline
                rows={4}
                translateFrom={fields.intro}
              />

              <Typography variant="h3" sx={{ mt: 2 }}>
                Founder 1
              </Typography>
              <TextFieldRow
                label="Name (EN)"
                value={fields.founderOneNameEn}
                onChange={updateField("founderOneNameEn")}
                translateFrom={fields.founderOneName}
              />
              <TextFieldRow
                label="Role (EN)"
                value={fields.founderOneRoleEn}
                onChange={updateField("founderOneRoleEn")}
                translateFrom={fields.founderOneRole}
              />
              <TextFieldRow
                label="Description (EN)"
                value={fields.founderOneDescriptionEn}
                onChange={updateField("founderOneDescriptionEn")}
                multiline
                rows={5}
                translateFrom={fields.founderOneDescription}
              />

              <Typography variant="h3" sx={{ mt: 2 }}>
                Founder 2
              </Typography>
              <TextFieldRow
                label="Name (EN)"
                value={fields.founderTwoNameEn}
                onChange={updateField("founderTwoNameEn")}
                translateFrom={fields.founderTwoName}
              />
              <TextFieldRow
                label="Role (EN)"
                value={fields.founderTwoRoleEn}
                onChange={updateField("founderTwoRoleEn")}
                translateFrom={fields.founderTwoRole}
              />
              <TextFieldRow
                label="Description (EN)"
                value={fields.founderTwoDescriptionEn}
                onChange={updateField("founderTwoDescriptionEn")}
                multiline
                rows={5}
                translateFrom={fields.founderTwoDescription}
              />

              <Typography variant="h3" sx={{ mt: 2 }}>
                Our story
              </Typography>
              <TextFieldRow
                label="Title (EN)"
                value={fields.historyTitleEn}
                onChange={updateField("historyTitleEn")}
                translateFrom={fields.historyTitle}
              />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                  <RichTextEditor
                    label="Description (EN)"
                    value={fields.historyContentHtmlEn || "<p></p>"}
                    onChange={updateField("historyContentHtmlEn")}
                  />
                </Box>
                <TranslateButton
                  sourceText={fields.historyContentHtml}
                  onTranslated={updateField("historyContentHtmlEn")}
                  html
                />
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography variant="h3">Fondateur 1</Typography>
              <MediaUrlField
                label="Photo fondateur 1"
                value={fields.founderOneImageUrl}
                onChange={updateField("founderOneImageUrl")}
                assetId={fields.founderOneImageAssetId}
                onAssetChange={(assetId) =>
                  updateField("founderOneImageAssetId")(assetId ?? "")
                }
                required
                accept={imageAccept}
                basePath="pages/studio"
                field="founder-one-photo"
                helperText="Image portrait recommandee."
              />
              {(fields.founderOneImageAlt || fields.founderOneImageAltEn) && (
                <Alert severity="info">
                  Ancien alt conserve en lecture seule :{" "}
                  {fields.founderOneImageAlt || "N/A"}
                  {fields.founderOneImageAltEn
                    ? ` / ${fields.founderOneImageAltEn}`
                    : ""}
                  . Les nouveaux alts se gerent depuis la galerie.
                </Alert>
              )}

              <Typography variant="h3" sx={{ mt: 2 }}>
                Fondateur 2
              </Typography>
              <MediaUrlField
                label="Photo fondateur 2"
                value={fields.founderTwoImageUrl}
                onChange={updateField("founderTwoImageUrl")}
                assetId={fields.founderTwoImageAssetId}
                onAssetChange={(assetId) =>
                  updateField("founderTwoImageAssetId")(assetId ?? "")
                }
                required
                accept={imageAccept}
                basePath="pages/studio"
                field="founder-two-photo"
                helperText="Image portrait recommandee."
              />
              {(fields.founderTwoImageAlt || fields.founderTwoImageAltEn) && (
                <Alert severity="info">
                  Ancien alt conserve en lecture seule :{" "}
                  {fields.founderTwoImageAlt || "N/A"}
                  {fields.founderTwoImageAltEn
                    ? ` / ${fields.founderTwoImageAltEn}`
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
