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

type EditableHomePageContent = Record<
  Exclude<keyof HomePageContentData, "id">,
  string
>;

const toEditableContent = (
  content: HomePageContentData,
): EditableHomePageContent => ({
  eyebrow: content.eyebrow,
  eyebrowEn: content.eyebrowEn ?? "",
  title: content.title,
  titleEn: content.titleEn ?? "",
  subheading: content.subheading,
  subheadingEn: content.subheadingEn ?? "",
  primaryCtaLabel: content.primaryCtaLabel,
  primaryCtaLabelEn: content.primaryCtaLabelEn ?? "",
  secondaryCtaLabel: content.secondaryCtaLabel,
  secondaryCtaLabelEn: content.secondaryCtaLabelEn ?? "",
});

const requiredFields = [
  ["eyebrow", "L'eyebrow est obligatoire."],
  ["title", "Le titre est obligatoire."],
  ["subheading", "Le sous-titre est obligatoire."],
  ["primaryCtaLabel", "Le libelle du CTA portfolio est obligatoire."],
  ["secondaryCtaLabel", "Le libelle du CTA contact est obligatoire."],
] as const satisfies readonly [keyof EditableHomePageContent, string][];

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
}: {
  content: HomePageContentData;
}) => {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState(() => toEditableContent(content));

  const updateField =
    (field: keyof EditableHomePageContent) => (value: string) => {
      setFields((current) => ({ ...current, [field]: value }));
    };

  const validateClient = () => {
    for (const [field, message] of requiredFields) {
      if (fields[field].trim().length < 2) return message;
    }

    return null;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientError = validateClient();
    setError(clientError);
    if (clientError) return;

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.set(key, value);
    });

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
            <Tab label="Francais" />
            <Tab label="English" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography variant="h3">Bloc apres la video</Typography>
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
                label="Sous-titre"
                value={fields.subheading}
                onChange={updateField("subheading")}
                required
                multiline
                rows={4}
              />
              <TextFieldRow
                label="CTA portfolio"
                value={fields.primaryCtaLabel}
                onChange={updateField("primaryCtaLabel")}
                required
                helperText="Le lien reste dirige vers la page portfolio."
              />
              <TextFieldRow
                label="CTA contact"
                value={fields.secondaryCtaLabel}
                onChange={updateField("secondaryCtaLabel")}
                required
                helperText="Le lien reste dirige vers la page contact."
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Alert severity="info">
                Les champs anglais sont optionnels. Le francais sera utilise si
                un champ reste vide.
              </Alert>
              <Typography variant="h3">Block after video</Typography>
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
                label="Subtitle (EN)"
                value={fields.subheadingEn}
                onChange={updateField("subheadingEn")}
                multiline
                rows={4}
                translateFrom={fields.subheading}
              />
              <TextFieldRow
                label="Portfolio CTA (EN)"
                value={fields.primaryCtaLabelEn}
                onChange={updateField("primaryCtaLabelEn")}
                translateFrom={fields.primaryCtaLabel}
              />
              <TextFieldRow
                label="Contact CTA (EN)"
                value={fields.secondaryCtaLabelEn}
                onChange={updateField("secondaryCtaLabelEn")}
                translateFrom={fields.secondaryCtaLabel}
              />
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
