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

type EditablePageHeaderContent = Record<
  Exclude<keyof PageHeaderContentData, "id">,
  string
>;

const toEditableContent = (
  content: PageHeaderContentData,
): EditablePageHeaderContent => ({
  eyebrow: content.eyebrow,
  eyebrowEn: content.eyebrowEn ?? "",
  title: content.title,
  titleEn: content.titleEn ?? "",
  intro: content.intro ?? "",
  introEn: content.introEn ?? "",
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

export const PageHeaderForm = ({
  content,
}: {
  content: PageHeaderContentData;
}) => {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState(() => toEditableContent(content));
  const isPortfolio = content.id === "portfolio";

  const updateField =
    (field: keyof EditablePageHeaderContent) => (value: string) => {
      setFields((current) => ({ ...current, [field]: value }));
    };

  const validateClient = () => {
    if (fields.eyebrow.trim().length < 2) {
      return "L'eyebrow est obligatoire.";
    }
    if (fields.title.trim().length < 2) {
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
    Object.entries(fields).forEach(([key, value]) => {
      formData.set(key, value);
    });

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
            <Tab label="Francais" />
            <Tab label="English" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
              {isPortfolio && (
                <TextFieldRow
                  label="Texte introductif"
                  value={fields.intro}
                  onChange={updateField("intro")}
                  multiline
                  rows={4}
                />
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextFieldRow
                label="Eyebrow anglais"
                value={fields.eyebrowEn}
                onChange={updateField("eyebrowEn")}
                translateFrom={fields.eyebrow}
              />
              <TextFieldRow
                label="Titre anglais"
                value={fields.titleEn}
                onChange={updateField("titleEn")}
                translateFrom={fields.title}
              />
              {isPortfolio && (
                <TextFieldRow
                  label="Intro anglaise"
                  value={fields.introEn}
                  onChange={updateField("introEn")}
                  multiline
                  rows={4}
                  translateFrom={fields.intro}
                />
              )}
            </Box>
          )}

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
