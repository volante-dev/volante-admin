"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import {
  createStudioValue,
  updateStudioValue,
} from "@/app/(admin)/studio-values/actions";
import { TranslateButton } from "@/components/admin/TranslateButton";
import type { StudioValueData } from "./studio-value-types";

export const StudioValueForm = ({
  studioValue,
}: {
  studioValue?: StudioValueData;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(studioValue?.title ?? "");
  const [titleEn, setTitleEn] = useState(studioValue?.titleEn ?? "");
  const [description, setDescription] = useState(
    studioValue?.description ?? "",
  );
  const [descriptionEn, setDescriptionEn] = useState(
    studioValue?.descriptionEn ?? "",
  );
  const [order, setOrder] = useState(String(studioValue?.order ?? 0));
  const [active, setActive] = useState(studioValue?.active ?? true);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError("Le titre doit contenir au moins 2 caracteres.");
      setTab(0);
      return;
    }
    if (description.trim().length < 10) {
      setError("La description doit contenir au moins 10 caracteres.");
      setTab(0);
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("titleEn", titleEn);
    formData.set("description", description);
    formData.set("descriptionEn", descriptionEn);
    formData.set("order", order);
    formData.set("active", String(active));

    startTransition(async () => {
      const result = studioValue
        ? await updateStudioValue(studioValue.id, formData)
        : await createStudioValue(formData);

      if (result.success) {
        toast.success(
          studioValue ? "Valeur mise a jour." : "Valeur creee avec succes.",
        );
        router.push("/studio-values");
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Titre"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                multiline
                rows={5}
                fullWidth
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Title (EN)"
                  value={titleEn}
                  onChange={(event) => setTitleEn(event.target.value)}
                  fullWidth
                  helperText="Optionnel : le francais sera utilise si ce champ est vide."
                />
                <TranslateButton sourceText={title} onTranslated={setTitleEn} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Description (EN)"
                  value={descriptionEn}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  multiline
                  rows={5}
                  fullWidth
                  helperText="Optionnel : le francais sera utilise si ce champ est vide."
                />
                <TranslateButton sourceText={description} onTranslated={setDescriptionEn} />
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Ordre"
              type="number"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
              }
              label="Actif"
            />
          </Box>

          <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => router.push("/studio-values")}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending
                ? "Enregistrement..."
                : studioValue
                  ? "Mettre a jour"
                  : "Creer"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
